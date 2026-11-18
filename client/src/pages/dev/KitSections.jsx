// Teacher / admin / super-admin charts and the states of the gallery.
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartCard, DistributionStrip, EmptyState, Funnel, ItemAnalysisTable, PlanLockCard, Skeleton, StudentSkillHeatmap, TrendLine, UnitSunburst,
  fmtDate, fmtDelta, fmtDuration, fmtNumber, fmtPercent, toTable,
} from '../../components/dashboard';
import { sampleDistribution, sampleFunnel, sampleItems, sampleStudentSkills, sampleTrend, sampleUnits } from '../../components/dashboard/sample';
import s from './DashboardKit.module.css';

export default function KitSections({ said }) {
  const { t } = useTranslation();
  const dist = useMemo(() => sampleDistribution(24), []);
  const { students, skills } = useMemo(() => sampleStudentSkills({ n: 14 }), []);
  const units = useMemo(() => sampleUnits(), []);
  const funnel = useMemo(() => sampleFunnel(), []);
  const items = useMemo(() => sampleItems(), []);
  const trend = useMemo(() => sampleTrend({ points: 10, seed: 2 }), []);

  return (
    <>
      <h2 className={s.h2}>Teacher and admin charts</h2>
      <ChartCard title="How is the whole class spread?" answer="Most of the class is between 55 % and 85 %. The square is the student you are looking at." info="Each dot is a student's accuracy this week. The shaded band holds the middle half of the class." table={toTable.distribution(dist, t)}>
        <DistributionStrip data={dist} domain={[0.3, 1]} highlightId="s7" onSelect={(it) => said(`Student: ${it.name}`)} />
      </ChartCard>

      <ChartCard title="Who needs help on what?" answer="4 students need a nudge, pinned on top." info="Cell = share of correct answers on that skill. Click a column header to sort by it." table={toTable.studentSkills(students, skills, t)}>
        <StudentSkillHeatmap students={students} skills={skills} onCellClick={(st, k) => said(`Cell: ${st.name} / ${k.label}`)} onStudentClick={(st) => said(`Student: ${st.name}`)} />
      </ChartCard>

      <div className={s.grid2}>
        <ChartCard title="How is the school organised and doing?" answer="Grade 4 engagement is the lowest." info="Angle = students, colour = engagement (share of students active this week)." table={toTable.units(units, t)}>
          <UnitSunburst root={units} scoreLabel="Engagement" onSelect={(n) => said(`Unit: ${n.name}`)} />
        </ChartCard>
        <ChartCard title="Where do people drop off?" answer="Only 6 % of sign-ups reach a paid plan." info="Each bar is compared with the first step." table={toTable.funnel(funnel, t)}>
          <Funnel steps={funnel} onSelect={(st) => said(`Funnel: ${st.label}`)} />
        </ChartCard>
      </div>

      <ChartCard title="Which questions were hard or broken?" answer="One question may be broken: strong students miss it too." info="Separates strong from weak: above 0.30 is good, under 0.10 means the question may be unclear.">
        <ItemAnalysisTable items={items} onSelect={(it) => said(`Question: ${it.id}`)} />
      </ChartCard>

      <h2 className={s.h2}>States that teach</h2>
      <div className={s.grid3}>
        <ChartCard title="Loading" answer="Skeleton shaped like the chart." loading />
        <ChartCard title="Nothing here yet" answer="One clear next step." empty={{ title: 'No lessons yet', text: 'Link your child to see their learning here.', actionLabel: 'Link your child', onAction: () => said('Empty state action') }} />
        <ChartCard title="Something went wrong" answer="Friendly, with a retry." error="The server did not answer in time." onRetry={() => said('Retry clicked')} />
      </div>
      <div className={s.grid3}>
        <PlanLockCard module="reports.branded" title="Branded school reports" text="Put your school logo on every PDF report and share them with parents in one click." onUpgrade={() => said('Upgrade clicked')}>
          <TrendLine data={trend} height={190} />
        </PlanLockCard>
        <PlanLockCard module="analytics.advanced" title="Item analysis" onUpgrade={() => said('Upgrade clicked')} />
        <div className={s.card}>
          <EmptyState title="Create your first group" text="Groups let you set tests and see progress for a whole class." actionLabel="Create group" onAction={() => said('Create group')} />
          <Skeleton variant="text" lines={3} />
        </div>
      </div>

      <h2 className={s.h2}>Number formats</h2>
      <div className={s.card}>
        <ul className={s.fmtList}>
          <li><code>fmtDuration(130)</code> {fmtDuration(130)}</li>
          <li><code>fmtDuration(45)</code> {fmtDuration(45)}</li>
          <li><code>fmtDuration(null)</code> {fmtDuration(null)}</li>
          <li><code>fmtNumber(12840)</code> {fmtNumber(12840)}</li>
          <li><code>fmtNumber(12840, compact)</code> {fmtNumber(12840, { compact: true })}</li>
          <li><code>fmtPercent(0.857)</code> {fmtPercent(0.857)}</li>
          <li><code>fmtPercent(undefined)</code> {fmtPercent(undefined)}</li>
          <li><code>fmtDelta(112, 100)</code> {fmtDelta(112, 100).text} <span className={s.muted}>({fmtDelta(112, 100).srText})</span></li>
          <li><code>fmtDelta(96, 100)</code> {fmtDelta(96, 100).text}</li>
          <li><code>fmtDelta(5, 0)</code> {fmtDelta(5, 0).text} <span className={s.muted}>(no comparison)</span></li>
          <li><code>fmtDate range</code> {fmtDate({ from: '2026-11-09', to: '2026-11-15' })}</li>
        </ul>
      </div>
    </>
  );
}
