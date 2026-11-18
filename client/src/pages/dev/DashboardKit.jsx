// Dev gallery for the dashboard kit: every component with sample data.
// Route: /dev/dashboard-kit  (only registered in dev or when VITE_ENABLE_DEV_PAGES=1)
// Theme: ?theme=light | dark (default follows the OS).  Range: ?range=week&cmp=prev …
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaBell, FaChartLine, FaClipboardList, FaCog, FaCommentDots, FaDownload, FaHome, FaQuestionCircle, FaUsers } from 'react-icons/fa';
import {
  Button, CalendarHeatmap, ChartCard, DashboardShell, HourWeekdayHeatmap, KpiTile, ProgressRing, SkillMap,
  StackedBars, StoryCard, SubjectModuleMatrix, TimeRangeBar, Timeline, TrendLine, fmtDuration, fmtPercent, toTable, useTimeRange,
} from '../../components/dashboard';
import {
  sampleDailyMinutes, sampleHourWeekday, sampleMatrix, sampleSkillMap, sampleSparkline, sampleStacked, sampleTerms, sampleTimeline, sampleTrend,
} from '../../components/dashboard/sample';
import KitSections from './KitSections';
import s from './DashboardKit.module.css';

const NAV = [
  { key: 'overview', label: 'Overview', icon: FaHome },
  { key: 'people', label: 'People', icon: FaUsers, badge: 3, children: [{ key: 'kids', label: 'Children' }, { key: 'teachers', label: 'Teachers' }] },
  { key: 'analytics', label: 'Analytics', icon: FaChartLine },
  { key: 'tests', label: 'Tests', icon: FaClipboardList },
  { key: 'messages', label: 'Messages', icon: FaCommentDots, badge: 12 },
  { key: 'settings', label: 'Settings', icon: FaCog },
];

export default function DashboardKit() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const theme = params.get('theme') === 'dark' ? 'dark' : params.get('theme') === 'light' ? 'light' : undefined;
  const [active, setActive] = useState('overview');
  const [log, setLog] = useState('Nothing clicked yet. Every number, cell and tile is a door.');
  const terms = useMemo(() => sampleTerms(), []);
  const tr = useTimeRange({ terms });

  const year = useMemo(() => sampleDailyMinutes({ days: 365 }), []);
  const week = useMemo(() => sampleStacked({ days: 7 }), []);
  const trend = useMemo(() => sampleTrend({ points: 14 }), []);
  const hw = useMemo(() => sampleHourWeekday(), []);
  const matrix = useMemo(() => sampleMatrix(), []);
  const skills = useMemo(() => sampleSkillMap(), []);
  const events = useMemo(() => sampleTimeline(), []);
  const last30 = year.slice(-30).map((d) => d.value);
  const said = (msg) => setLog(msg);
  const setTheme = (v) => setParams((p) => { const n = new URLSearchParams(p); if (v) n.set('theme', v); else n.delete('theme'); return n; }, { replace: true });

  return (
    <DashboardShell
      fill
      theme={theme}
      brand={{ label: 'LEARNIGO', to: '/dev/dashboard-kit' }}
      nav={NAV.map((n) => ({ ...n, onClick: () => setActive(n.key), children: n.children?.map((c) => ({ ...c, onClick: () => setActive(c.key) })) }))}
      active={active}
      breadcrumbs={[{ label: 'Sunrise School', to: '/dev/dashboard-kit' }, { label: 'Grade 5', to: '/dev/dashboard-kit' }, { label: 'Aanya R.' }]}
      contextSwitcher={<span className={s.chipPill}>Aanya R. &middot; Parent</span>}
      bell={<button type="button" className={s.iconBtn} aria-label="Notifications, 3 new"><FaBell aria-hidden="true" /><span className={s.dotBadge}>3</span></button>}
      user={<span className={s.avatar} aria-label="Account of Aanya">A</span>}
      actions={<Button variant="ghost" icon={FaDownload} size="sm" onClick={() => said('Export clicked')}>Export</Button>}
    >
      <div className={s.themeRow} role="group" aria-label="Theme">
        {[[undefined, 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([v, label]) => (
          <button key={label} type="button" className={s.themeBtn} aria-pressed={theme === v} onClick={() => setTheme(v)}>{label}</button>
        ))}
        <span className={s.log} aria-live="polite"><FaQuestionCircle aria-hidden="true" /> {log}</span>
      </div>

      <TimeRangeBar value={tr} />
      <p className={s.rangeNote}>
        <code>{tr.range}</code> {tr.from} &rarr; {tr.to}
        {tr.prevFrom && <> &middot; compared with {tr.prevFrom} &rarr; {tr.prevTo}</>}
      </p>

      <StoryCard
        sentence={<>Aanya learned <strong>2 h 10 min</strong> this week, <strong>25 min more</strong> than last week, and mastered <strong>3 skills</strong>.</>}
        chips={[
          { kind: 'celebrate', text: '9-day streak', onClick: () => said('Opened: streak') },
          { kind: 'info', text: 'Most active on Saturdays', onClick: () => said('Opened: hour x weekday') },
          { kind: 'nudge', text: 'Practise next: Fractions', onClick: () => said('Opened: Fractions') },
          { kind: 'alert', text: 'Science test due Friday', onClick: () => said('Opened: tests') },
        ]}
      />

      <div className={s.kpis}>
        <KpiTile label="Learning time" value={fmtDuration(130)} delta={{ current: 130, previous: 105, mode: 'duration', vs: 'last week' }} sparkline={last30} tone="good"
          helpText="Minutes with at least one answered question, added up over the range." onClick={() => said('Opened: learning time')} />
        <KpiTile label="Accuracy" value={fmtPercent(0.86)} delta={{ current: 0.86, previous: 0.8, mode: 'points', vs: 'last week' }} sparkline={sampleSparkline(14, 4, 80)} tone="good"
          helpText="Correct answers divided by all answers." onClick={() => said('Opened: accuracy')} />
        <KpiTile label="Skills mastered" value={41} delta={{ current: 41, previous: 38, mode: 'number' }} sparkline={sampleSparkline(14, 5, 30)} helpText="Skills with three correct answers in a row, twice." />
        <KpiTile label="Days active" value="5" unit="of 7" delta={{ current: 5, previous: 6, mode: 'number', vs: 'last week' }} tone="attention" helpText="Days with any learning." />
        <KpiTile label="Questions needing a retry" value={12} delta={{ current: 12, previous: 9, mode: 'percent', lowerIsBetter: true }} tone="alert" helpText="Questions answered wrongly at least twice." />
        <KpiTile label="Homework done" value={null} helpText="Not set up yet: ask the teacher to assign homework." />
      </div>

      <div className={s.grid2}>
        <ChartCard
          title="How are they doing in each subject?"
          answer="Strongest in English listening; Science speaking has not started."
          info="Colour is the mastery level, the big number is accuracy over the selected range."
          table={toTable.matrix(matrix, t)}
        >
          <SubjectModuleMatrix cells={matrix} onSelect={(sub, mod) => said(`Matrix: ${sub} ${mod}`)} />
        </ChartCard>
        <div className={s.stack}>
          <ChartCard title="Is the weekly goal in reach?" answer="95 of 150 minutes so far, 3 days left." info="Goal set by the parent in Settings.">
            <div className={s.rings}>
              <ProgressRing value={95} goal={150} label="Weekly minutes" />
              <ProgressRing value={8} goal={8} label="Tests done" unit="" color="var(--d-good)" />
              <ProgressRing value={3} goal={7} label="Skills this week" unit="" color="var(--d-maths)" />
            </div>
          </ChartCard>
          <ChartCard title="When do they learn best?" answer="After school, around 17:00 on weekdays." info="Average minutes in each hour of the week." table={toTable.hourWeekday(hw, t)}>
            <HourWeekdayHeatmap data={hw} onSelect={(w, h) => said(`Hour heatmap: day ${w}, hour ${h}`)} />
          </ChartCard>
        </div>
      </div>

      <ChartCard title="How much and how often over the year?" answer="Learning on 214 of the last 365 days." info="Each square is one day. Darker means more minutes." table={toTable.calendar(year, t)}>
        <CalendarHeatmap data={year} goal={45} onSelect={(d) => said(`Calendar: ${d}`)} />
      </ChartCard>

      <div className={s.grid2}>
        <ChartCard title="What did they learn each day?" answer="Maths led on most days this week." info="Minutes per day, split by subject. Textures repeat the colours." table={toTable.stacked(week, t)}>
          <StackedBars data={week} goal={30} />
        </ChartCard>
        <ChartCard title="Is it getting better?" answer="Up 18 % on the previous two weeks." info="Solid line: this period. Dashed: the period before." table={toTable.trend(trend, t)}>
          <TrendLine data={trend} milestones={[{ x: trend[5].x, label: 'Fractions test' }, { x: trend[10].x, label: '7-day streak' }]} />
        </ChartCard>
      </div>

      <div className={s.grid2}>
        <ChartCard title="This month at a glance" answer="Every day is a door: tap one." info="Month view of the same calendar." >
          <CalendarHeatmap data={year} mode="month" onSelect={(d) => said(`Month: ${d}`)} />
        </ChartCard>
        <ChartCard title="What can they do now?" answer="12 of 17 skills practised or mastered." info="Skills grouped by topic. Switch on Then vs now to see growth." table={toTable.skills(skills, t)}>
          <SkillMap skills={skills} onSelect={(k) => said(`Skill: ${k.label}`)} />
        </ChartCard>
      </div>

      <ChartCard title="What happened, in order?" answer="Two lessons and a milestone today." info="Tap a row to see the answers.">
        <Timeline events={events} />
      </ChartCard>

      <KitSections said={said} />
    </DashboardShell>
  );
}
