// Learning evidence for parents and teachers (JOURNEY-CONTRACT §2 `evidence`).
//
//   import { EvidencePanel, WeekSummary, SAMPLE_EVIDENCE } from "../../components/learning/evidence";
//   <EvidencePanel evidence={learning.evidence} name="Aanya" />            // parent / teacher
//   <EvidencePanel evidence={SAMPLE_EVIDENCE} name="Mia" example />        // landing, labelled "Example data"
//   <WeekSummary evidence={learning.evidence} goals={learning.profile?.goals} next={learning.next} name="Aanya" />
export { default as EvidencePanel } from "./EvidencePanel";
export { default as WeekSummary } from "./WeekSummary";
export { default as ThenNow } from "./ThenNow";
export { StageGrowth, StageAccuracy } from "./ThinkingCharts";
export { IndependenceChart, RetentionChart } from "./WeeklyCharts";
export { Insights, Misconceptions, Decisions, Activity } from "./Lists";
export { SAMPLE_EVIDENCE, EMPTY_EVIDENCE } from "./sample";
export { normaliseEvidence, say, isPlaceholder, pickInsights, stageName, stageShort, stageText, STAGES, SMALL_N, SMALL_WEEK } from "./model";
