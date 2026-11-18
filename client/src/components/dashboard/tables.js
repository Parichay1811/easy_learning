// "View as table" data for ChartCard: turn the SAME json a chart receives into
// { columns, rows } for DataTable. Pass i18next's `t` so headers are translated.
//
//   const { t } = useTranslation();
//   <ChartCard table={toTable.trend(data, t, { unit: 'min' })}> <TrendLine data={data} /> </ChartCard>
import { masteryFromScore, masteryLabel, moduleLabel, subjectLabel } from './constants';
import { addDays, parseISO, startOfWeek, toISO } from './dates';
import { fmtDate, fmtDuration, fmtNumber, fmtPercent, weekdayNames } from './format';
import { defaultXFull } from './charts/rechartsBits';

const fmtUnit = (unit) => (v) => (v == null ? '—' : unit === 'min' ? fmtDuration(v) : `${fmtNumber(v)}${unit ? ` ${unit}` : ''}`);
const col = (key, label, extra = {}) => ({ key, label, sortable: true, ...extra });

export const toTable = {
  /** CalendarHeatmap data -> one row per week (a year of days would be 365 rows). */
  calendar(data, t, { unit = 'min' } = {}) {
    const f = fmtUnit(unit);
    const weeks = new Map();
    data.forEach((d) => {
      const dt = parseISO(d.date);
      if (!dt) return;
      const key = toISO(startOfWeek(dt));
      const w = weeks.get(key) || { week: key, total: 0, days: 0, best: 0 };
      w.total += d.value || 0;
      if (d.value > 0) w.days += 1;
      w.best = Math.max(w.best, d.value || 0);
      weeks.set(key, w);
    });
    return {
      columns: [
        col('week', t('dash.table.week', { defaultValue: 'Week' }), { render: (r) => fmtDate({ from: r.week, to: toISO(addDays(parseISO(r.week), 6)) }, { style: 'day' }) }),
        col('total', t('dash.table.total', { defaultValue: 'Total' }), { align: 'end', render: (r) => f(r.total) }),
        col('days', t('dash.table.activeDays', { defaultValue: 'Active days' }), { align: 'end' }),
        col('best', t('dash.table.bestDay', { defaultValue: 'Best day' }), { align: 'end', render: (r) => f(r.best) }),
      ],
      rows: [...weeks.values()].sort((a, b) => (a.week < b.week ? 1 : -1)),
      getRowKey: (r) => r.week,
    };
  },

  /** HourWeekdayHeatmap data -> one row per weekday with total and busiest hour. */
  hourWeekday(data, t, { unit = 'min' } = {}) {
    const f = fmtUnit(unit);
    const names = weekdayNames({ style: 'long' });
    const rows = names.map((name, w) => {
      const own = data.filter((d) => d.weekday === w);
      const peak = own.reduce((a, b) => (b.value > (a?.value ?? -1) ? b : a), null);
      return { w, name, total: own.reduce((a, b) => a + (b.value || 0), 0), peak: peak && peak.value > 0 ? `${String(peak.hour).padStart(2, '0')}:00` : '—' };
    });
    return {
      columns: [
        col('name', t('dash.table.weekday', { defaultValue: 'Weekday' }), { sortable: false }),
        col('total', t('dash.table.total', { defaultValue: 'Total' }), { align: 'end', render: (r) => f(r.total) }),
        col('peak', t('dash.table.peakHour', { defaultValue: 'Busiest hour' }), { align: 'end' }),
      ],
      rows,
      getRowKey: (r) => r.w,
    };
  },

  /** SubjectModuleMatrix cells -> one row per subject x module. */
  matrix(cells, t) {
    return {
      columns: [
        col('subject', t('dash.table.subject', { defaultValue: 'Subject' }), { render: (r) => subjectLabel(t, r.subject) }),
        col('module', t('dash.table.module', { defaultValue: 'Module' }), { render: (r) => moduleLabel(t, r.module) }),
        col('accuracy', t('dash.table.accuracy', { defaultValue: 'Accuracy' }), { align: 'end', render: (r) => fmtPercent(r.accuracy) }),
        col('minutes', t('dash.table.time', { defaultValue: 'Time' }), { align: 'end', render: (r) => fmtDuration(r.minutes) }),
        col('level', t('dash.table.level', { defaultValue: 'Level' }), { sortValue: (r) => masteryFromScore(r.accuracy).level, render: (r) => masteryLabel(t, r.level ?? masteryFromScore(r.accuracy).key) }),
      ],
      rows: cells,
      getRowKey: (r) => `${r.subject}-${r.module}`,
    };
  },

  /** TrendLine data -> date, this period, previous period. */
  trend(data, t, { unit = 'min' } = {}) {
    const f = fmtUnit(unit);
    return {
      columns: [
        col('x', t('dash.table.date', { defaultValue: 'Date' }), { render: (r) => defaultXFull(r.x) }),
        col('value', t('dash.trend.current', { defaultValue: 'This period' }), { align: 'end', render: (r) => f(r.value) }),
        col('prev', t('dash.trend.prev', { defaultValue: 'Previous period' }), { align: 'end', render: (r) => f(r.prev) }),
      ],
      rows: data,
      getRowKey: (r) => r.x,
    };
  },

  /** StackedBars data -> date, one column per series, total. */
  stacked(data, t, { series, unit = 'min' } = {}) {
    const f = fmtUnit(unit);
    const keys = series || ['english', 'maths', 'science'].map((k) => ({ key: k, label: subjectLabel(t, k) }));
    return {
      columns: [
        col('x', t('dash.table.date', { defaultValue: 'Date' }), { render: (r) => defaultXFull(r.x) }),
        ...keys.map((k) => col(k.key, k.label, { align: 'end', render: (r) => f(r[k.key]) })),
        col('total', t('dash.stack.total', { defaultValue: 'Total' }), { align: 'end', sortValue: (r) => keys.reduce((a, k) => a + (r[k.key] || 0), 0), render: (r) => f(keys.reduce((a, k) => a + (r[k.key] || 0), 0)) }),
      ],
      rows: data,
      getRowKey: (r) => r.x,
    };
  },

  /** DistributionStrip data -> name and value. */
  distribution(data, t, { format } = {}) {
    const f = format || fmtPercent;
    return {
      columns: [
        col('name', t('dash.table.student', { defaultValue: 'Student' })),
        col('value', t('dash.table.value', { defaultValue: 'Value' }), { align: 'end', render: (r) => f(r.value) }),
      ],
      rows: data,
      getRowKey: (r) => r.id,
    };
  },

  /** StudentSkillHeatmap props -> one row per student, one column per skill. */
  studentSkills(students, skills, t) {
    return {
      columns: [
        col('name', t('dash.table.student', { defaultValue: 'Student' })),
        ...skills.map((k) => col(k.id, k.label, { align: 'end', sortValue: (r) => r.scores?.[k.id], render: (r) => fmtPercent(r.scores?.[k.id]) })),
      ],
      rows: students,
      getRowKey: (r) => r.id,
    };
  },

  /** Funnel steps -> step, count, share of previous. */
  funnel(steps, t) {
    return {
      columns: [
        col('label', t('dash.table.step', { defaultValue: 'Step' }), { sortable: false }),
        col('value', t('dash.table.count', { defaultValue: 'Count' }), { align: 'end', render: (r) => fmtNumber(r.value) }),
        col('keep', t('dash.table.keep', { defaultValue: 'Of previous step' }), { align: 'end', render: (r) => fmtPercent(r.keep) }),
      ],
      rows: steps.map((s, i) => ({ ...s, keep: i && steps[i - 1].value ? s.value / steps[i - 1].value : null })),
      getRowKey: (r) => r.key,
    };
  },

  /** UnitSunburst root -> the first two levels as a flat list. */
  units(root, t) {
    const rows = [];
    const walk = (n, depth, parent) => {
      (n.children || []).forEach((c) => {
        rows.push({ id: `${parent}/${c.id}`, name: c.name, parent: n.name, students: c.students, score: c.score });
        if (depth < 1) walk(c, depth + 1, `${parent}/${c.id}`);
      });
    };
    walk(root, 0, root.id);
    return {
      columns: [
        col('name', t('dash.table.unit', { defaultValue: 'Unit' })),
        col('parent', t('dash.table.inside', { defaultValue: 'Inside' })),
        col('students', t('dash.table.students', { defaultValue: 'Students' }), { align: 'end', render: (r) => fmtNumber(r.students) }),
        col('score', t('dash.table.score', { defaultValue: 'Score' }), { align: 'end', render: (r) => fmtPercent(r.score) }),
      ],
      rows,
      getRowKey: (r) => r.id,
    };
  },

  /** SkillMap skills -> topic, skill, level. */
  skills(skills, t) {
    return {
      columns: [
        col('topic', t('dash.table.topic', { defaultValue: 'Topic' })),
        col('label', t('dash.table.skill', { defaultValue: 'Skill' })),
        col('level', t('dash.table.level', { defaultValue: 'Level' }), { render: (r) => masteryLabel(t, r.level) }),
      ],
      rows: skills,
      getRowKey: (r) => r.id,
    };
  },
};
