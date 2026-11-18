// Learnigo dashboard kit. Import everything from here:
//   import { DashboardShell, KpiTile, ChartCard, TrendLine, useTimeRange, fmtDuration } from '../../components/dashboard';
// See README.md in this folder for every component's props.
import './tokens.css';

// Frame, controls
export { default as DashboardShell } from './DashboardShell';
export { default as TimeRangeBar } from './TimeRangeBar';
export { useTimeRange, resolveRange, resolveCompare, RANGES, COMPARES } from './useTimeRange';

// Cards and states
export { default as KpiTile } from './KpiTile';
export { default as Sparkline } from './Sparkline';
export { default as StoryCard } from './StoryCard';
export { default as ChartCard } from './ChartCard';
export { default as EmptyState } from './EmptyState';
export { default as Skeleton } from './Skeleton';
export { default as PlanLockCard } from './PlanLockCard';
export { default as InfoTip } from './InfoTip';
export { default as Button } from './Button';
export { default as DataTable } from './DataTable';

// Charts
export { default as CalendarHeatmap } from './charts/CalendarHeatmap';
export { default as HourWeekdayHeatmap } from './charts/HourWeekdayHeatmap';
export { default as SubjectModuleMatrix } from './charts/SubjectModuleMatrix';
export { default as TrendLine } from './charts/TrendLine';
export { default as StackedBars } from './charts/StackedBars';
export { default as ProgressRing } from './charts/ProgressRing';
export { default as DistributionStrip } from './charts/DistributionStrip';
export { default as StudentSkillHeatmap } from './charts/StudentSkillHeatmap';
export { default as Timeline } from './charts/Timeline';
export { default as SkillMap, MasteryChips } from './charts/SkillMap';
export { default as UnitSunburst } from './charts/UnitSunburst';
export { default as Funnel } from './charts/Funnel';
export { default as ItemAnalysisTable } from './charts/ItemAnalysisTable';
export { MasteryGlyph, MasteryLegend, HeatLegend } from './charts/Heat';

// Helpers
export { toTable } from './tables';
export { SUBJECTS, MODULES, MASTERY, masteryOf, masteryFromScore, subjectOf, moduleOf, subjectLabel, moduleLabel, masteryLabel } from './constants';
export { fmtDuration, fmtDelta, fmtNumber, fmtPercent, fmtDate, useFormat, NO_DATA } from './format';
export { toISO, parseISO, today, addDays } from './dates';
export { capPoints, itemFlag } from './utils';
