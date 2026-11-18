// Deterministic sample data for the dashboard kit: demos, tests, screenshots.
// Every generator takes an optional `seed` and returns plain JSON in the exact
// shape the matching chart expects.
import { addDays, toISO, today } from './dates';

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = ['Aanya', 'Ravi', 'Meera', 'Tom', 'Lena', 'Noah', 'Sofia', 'Kabir', 'Zara', 'Mateo', 'Ines', 'Hiro', 'Priya', 'Omar', 'Chloe', 'Ben', 'Nora', 'Leo', 'Isha', 'Finn', 'Maya', 'Arjun', 'Eva', 'Luca'];
const ISO = (d) => toISO(d);

/** number[] for KpiTile sparkline */
export function sampleSparkline(n = 14, seed = 3, base = 20) {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => Math.round(base + i * 0.6 + (r() - 0.4) * base * 0.6));
}

/** CalendarHeatmap data, also the source of StackedBars. [{date, value, english, maths, science}] */
export function sampleDailyMinutes({ days = 365, seed = 7, end = today() } = {}) {
  const r = rng(seed);
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = addDays(end, -i);
    const dow = (d.getDay() + 6) % 7;
    const recent = i < 9; // a 9-day streak ending today
    const active = recent || r() > (dow >= 5 ? 0.3 : 0.45);
    if (!active) { out.push({ date: ISO(d), value: 0, english: 0, maths: 0, science: 0 }); continue; }
    const total = Math.round((dow >= 5 ? 38 : 22) * (0.5 + r()) + (recent ? 8 : 0));
    const e = Math.round(total * (0.25 + r() * 0.3));
    const m = Math.round((total - e) * (0.4 + r() * 0.3));
    out.push({ date: ISO(d), value: total, english: e, maths: m, science: Math.max(0, total - e - m) });
  }
  return out;
}

/** StackedBars data for the last `days` days. */
export function sampleStacked({ days = 14, seed = 11, end = today() } = {}) {
  return sampleDailyMinutes({ days, seed, end }).map((d) => ({ x: d.date, english: d.english, maths: d.maths, science: d.science }));
}

/** HourWeekdayHeatmap data: [{weekday 0-6 Mon-first, hour 0-23, value}] */
export function sampleHourWeekday(seed = 5) {
  const r = rng(seed);
  const out = [];
  for (let w = 0; w < 7; w += 1) {
    for (let h = 6; h < 22; h += 1) {
      const weekend = w >= 5;
      const peak = weekend ? Math.exp(-((h - 10) ** 2) / 8) + 0.5 * Math.exp(-((h - 16) ** 2) / 6) : Math.exp(-((h - 17) ** 2) / 4.5);
      const v = Math.round(peak * 34 * (0.5 + r()));
      if (v > 2) out.push({ weekday: w, hour: h, value: v });
    }
  }
  return out;
}

/** SubjectModuleMatrix cells (12). */
export function sampleMatrix(seed = 9) {
  const r = rng(seed);
  const cells = [];
  ['english', 'maths', 'science'].forEach((subject, si) => ['listen', 'read', 'write', 'speak'].forEach((module, mi) => {
    if (si === 2 && mi === 3) { cells.push({ subject, module, accuracy: null, minutes: 0 }); return; } // one not started
    const acc = Math.min(0.97, 0.3 + r() * 0.65);
    cells.push({ subject, module, accuracy: Math.round(acc * 100) / 100, minutes: Math.round(20 + r() * 140) });
  }));
  return cells;
}

/** TrendLine data with a previous-period series. */
export function sampleTrend({ points = 14, seed = 13, end = today() } = {}) {
  const r = rng(seed);
  return Array.from({ length: points }, (_, i) => {
    const d = addDays(end, -(points - 1 - i));
    return { x: ISO(d), value: Math.round(20 + i * 1.6 + r() * 16), prev: Math.round(18 + i * 0.8 + r() * 14) };
  });
}

/** Class distribution: [{id, name, value 0..1}] */
export function sampleDistribution(n = 24, seed = 17) {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => ({
    id: `s${i + 1}`,
    name: NAMES[i % NAMES.length] + (i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : ''),
    value: Math.min(0.99, Math.max(0.12, 0.72 + (r() + r() + r() - 1.5) * 0.45)),
  }));
}

/** { students, skills } for StudentSkillHeatmap */
export function sampleStudentSkills({ n = 14, seed = 19 } = {}) {
  const r = rng(seed);
  const skills = [
    { id: 'frac', label: 'Fractions' }, { id: 'dec', label: 'Decimals' }, { id: 'geo', label: 'Shapes' },
    { id: 'read', label: 'Reading' }, { id: 'spell', label: 'Spelling' }, { id: 'life', label: 'Life cycles' },
  ];
  const students = Array.from({ length: n }, (_, i) => {
    const ability = 0.35 + r() * 0.6;
    const scores = {};
    skills.forEach((k) => {
      const v = ability + (r() - 0.5) * 0.35;
      scores[k.id] = r() < 0.06 ? null : Math.round(Math.min(0.99, Math.max(0.05, v)) * 100) / 100;
    });
    return { id: `st${i + 1}`, name: NAMES[i % NAMES.length], atRisk: ability < 0.48, scores };
  });
  return { students, skills };
}

/** Skills with topic and mastery level (0-3) and previous level. */
export function sampleSkillMap(seed = 23) {
  const r = rng(seed);
  const topics = {
    Fractions: ['Halves', 'Quarters', 'Compare fractions', 'Add fractions', 'Equivalent fractions'],
    'Reading words': ['Letter sounds', 'Blending', 'Sight words', 'Long vowels'],
    'Plants and animals': ['Life cycles', 'Habitats', 'Food chains'],
    Writing: ['Capital letters', 'Full stops', 'Describing words', 'Joining sentences'],
  };
  const out = [];
  Object.entries(topics).forEach(([topic, list]) => list.forEach((label, i) => {
    const level = Math.min(3, Math.max(0, Math.round(r() * 3.2 - (i > 2 ? 0.6 : 0))));
    out.push({ id: `${topic}-${i}`, topic, label, level, prevLevel: Math.max(0, level - (r() > 0.5 ? 1 : 0)) });
  }));
  return out;
}

/** Timeline events (newest first is applied by the component). */
export function sampleTimeline({ end = today() } = {}) {
  const day = (n, hm) => `${ISO(addDays(end, -n))}T${hm}:00`;
  return [
    { id: 'e1', time: day(0, '16:20'), kind: 'session', subject: 'maths', title: 'Fractions practice', subtitle: '12 questions, 10 correct', minutes: 18, details: [
      { label: '1/2 + 1/4 = ?', value: '3/4', ok: true }, { label: 'Which is bigger, 2/3 or 3/5?', value: '2/3', ok: true }, { label: '3/8 + 2/8 = ?', value: '6/16', ok: false } ] },
    { id: 'e2', time: day(0, '17:05'), kind: 'milestone', title: 'Mastered: Compare fractions' },
    { id: 'e3', time: day(1, '15:40'), kind: 'session', subject: 'english', title: 'Reading: The Fox and the Crow', subtitle: '8 questions, 7 correct', minutes: 14, details: [
      { label: 'Who tricked the crow?', value: 'The fox', ok: true }, { label: 'Why did the crow sing?', value: 'To show off', ok: true } ] },
    { id: 'e4', time: day(1, '16:10'), kind: 'game', subject: 'english', title: 'Word Catch', subtitle: 'Score 840', minutes: 6 },
    { id: 'e5', time: day(3, '18:00'), kind: 'test', subject: 'science', title: 'Test: Life cycles', subtitle: '16 of 20 correct', minutes: 22, details: [
      { label: 'What comes after the pupa?', value: 'Butterfly', ok: true }, { label: 'Where do frogs lay eggs?', value: 'On trees', ok: false } ] },
    { id: 'e6', time: day(4, '10:15'), kind: 'message', title: 'Message from Ms Rao', subtitle: 'Great work on the Science test!' },
  ];
}

/** UnitSunburst tree: school -> campus/grade -> section. score = engagement 0..1 */
export function sampleUnits(seed = 29) {
  const r = rng(seed);
  const grade = (id, name, sections) => ({
    id, name, score: 0, children: sections.map((s) => ({ id: `${id}${s}`, name: `${name.replace('Grade ', '')}${s}`, students: Math.round(22 + r() * 10), score: Math.round((0.25 + r() * 0.7) * 100) / 100 })),
  });
  const campus = (id, name, grades) => ({ id, name, score: 0, children: grades });
  const root = {
    id: 'school', name: 'Sunrise School', score: 0,
    children: [
      campus('main', 'Main campus', [grade('g3', 'Grade 3', ['A', 'B']), grade('g4', 'Grade 4', ['A', 'B', 'C']), grade('g5', 'Grade 5', ['A', 'B'])]),
      campus('city', 'City campus', [grade('g6', 'Grade 6', ['A', 'B']), grade('g7', 'Grade 7', ['A'])]),
    ],
  };
  const fill = (n) => {
    if (!n.children) return { s: n.students, w: n.score * n.students };
    const sums = n.children.map(fill).reduce((a, b) => ({ s: a.s + b.s, w: a.w + b.w }), { s: 0, w: 0 });
    n.score = Math.round((sums.w / sums.s) * 100) / 100;
    return sums;
  };
  fill(root);
  return root;
}

/** Funnel steps. */
export function sampleFunnel() {
  return [
    { key: 'signup', label: 'Signed up', value: 12840 },
    { key: 'lesson', label: 'First lesson', value: 9120 },
    { key: 'day7', label: 'Back on day 7', value: 5650 },
    { key: 'paid', label: 'Paid', value: 786 },
  ];
}

/** ItemAnalysisTable items. */
export function sampleItems() {
  return [
    { id: 'q1', question: 'What is 3/4 + 1/4?', attempts: 214, pctCorrect: 0.91, discrimination: 0.32, avgSeconds: 24, commonWrong: { answer: '4/8', pct: 0.06 } },
    { id: 'q2', question: 'Which fraction is bigger: 2/3 or 3/5?', attempts: 198, pctCorrect: 0.58, discrimination: 0.44, avgSeconds: 41, commonWrong: { answer: '3/5', pct: 0.31 } },
    { id: 'q3', question: 'Write 0.5 as a fraction.', attempts: 187, pctCorrect: 0.24, discrimination: 0.18, avgSeconds: 52, commonWrong: { answer: '5/10', pct: 0.4 } },
    { id: 'q4', question: 'How many sides does a hexagon have?', attempts: 221, pctCorrect: 0.97, discrimination: 0.05, avgSeconds: 11, commonWrong: { answer: '8', pct: 0.02 } },
    { id: 'q5', question: 'Round 4.67 to one decimal place.', attempts: 143, pctCorrect: 0.19, discrimination: -0.04, avgSeconds: 64, commonWrong: { answer: '4.6', pct: 0.52 } },
    { id: 'q6', question: 'What is 1/2 of 18?', attempts: 4, pctCorrect: 1, discrimination: null, avgSeconds: 17, commonWrong: null },
  ];
}

export function sampleTerms(year = new Date().getFullYear()) {
  return [
    { key: 't1', label: 'Term 1', from: `${year}-01-08`, to: `${year}-04-05` },
    { key: 't2', label: 'Term 2', from: `${year}-04-22`, to: `${year}-07-12` },
    { key: 't3', label: 'Term 3', from: `${year}-09-02`, to: `${year}-12-18` },
  ];
}
