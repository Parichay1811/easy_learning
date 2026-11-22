// Example evidence in the exact shape the engine sends (JOURNEY-CONTRACT §2),
// for the landing page's "Example data" preview, the dev kit and tests.
// Made-up numbers for a made-up learner; never shown as anyone's real data.
//
//   import { EvidencePanel, SAMPLE_EVIDENCE } from "../learning/evidence";
//   <EvidencePanel evidence={SAMPLE_EVIDENCE} name="Mia" example />

const WEEKS = ["2026-09-28", "2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26", "2026-11-02", "2026-11-09", "2026-11-16"];

export const SAMPLE_EVIDENCE = {
  baseline: {
    english: { level: 1, accuracy: 0.6, n: 10, at: "2026-09-29", source: "placement" },
    maths: { level: 2, accuracy: 0.55, n: 10, at: "2026-09-29", source: "placement" },
    science: { level: 1, accuracy: 0.67, n: 6, at: "2026-10-14", source: "first_attempts" },
  },
  current: {
    english: { level: 2, accuracy: 0.8, n: 20 },
    maths: { level: 3, accuracy: 0.85, n: 20 },
    science: { level: 1, accuracy: 0.75, n: 8 },
  },
  byStage: {
    0: { attempts: 18, correct: 17, independent: 18 },
    1: { attempts: 52, correct: 47, independent: 46 },
    2: { attempts: 61, correct: 50, independent: 44 },
    3: { attempts: 29, correct: 21, independent: 17 },
    4: { attempts: 4, correct: 2, independent: 1 },
    5: { attempts: 0, correct: 0, independent: 0 },
  },
  stageReached: [
    { week: WEEKS[0], subject: "maths", stage: 1 }, { week: WEEKS[0], subject: "english", stage: 0 },
    { week: WEEKS[1], subject: "maths", stage: 1 }, { week: WEEKS[1], subject: "english", stage: 1 },
    { week: WEEKS[2], subject: "maths", stage: 2 }, { week: WEEKS[2], subject: "english", stage: 1 }, { week: WEEKS[2], subject: "science", stage: 0 },
    { week: WEEKS[3], subject: "maths", stage: 2 }, { week: WEEKS[3], subject: "english", stage: 2 },
    { week: WEEKS[4], subject: "maths", stage: 3 }, { week: WEEKS[4], subject: "english", stage: 2 }, { week: WEEKS[4], subject: "science", stage: 1 },
    { week: WEEKS[5], subject: "maths", stage: 3 }, { week: WEEKS[5], subject: "english", stage: 2 },
    { week: WEEKS[6], subject: "maths", stage: 3 }, { week: WEEKS[6], subject: "english", stage: 3 }, { week: WEEKS[6], subject: "science", stage: 1 },
    { week: WEEKS[7], subject: "maths", stage: 4 }, { week: WEEKS[7], subject: "english", stage: 3 },
  ],
  independence: [
    { week: WEEKS[0], independent: 9, assisted: 7 }, { week: WEEKS[1], independent: 13, assisted: 8 },
    { week: WEEKS[2], independent: 15, assisted: 7 }, { week: WEEKS[3], independent: 12, assisted: 4 },
    { week: WEEKS[4], independent: 19, assisted: 6 }, { week: WEEKS[5], independent: 17, assisted: 4 },
    { week: WEEKS[6], independent: 21, assisted: 4 }, { week: WEEKS[7], independent: 20, assisted: 3 },
  ],
  retention: {
    reviews: 41, correct: 33, rate: 0.8,
    byWeek: [
      { week: WEEKS[2], reviews: 3, correct: 2 }, { week: WEEKS[3], reviews: 5, correct: 3 },
      { week: WEEKS[4], reviews: 7, correct: 5 }, { week: WEEKS[5], reviews: 8, correct: 7 },
      { week: WEEKS[6], reviews: 9, correct: 8 }, { week: WEEKS[7], reviews: 9, correct: 8 },
    ],
  },
  misconceptions: {
    seen: 3,
    resolved: 2,
    items: [
      { skill: "maths.subtraction-regrouping", skillName: "Subtraction with regrouping", subject: "maths", count: 3, parentNote: "Use coins or blocks to swap one ten for ten ones before taking away.", resolvedAt: null },
      { skill: "maths.place-value-tens", skillName: "Place value: tens and ones", subject: "maths", count: 2, parentNote: "Read numbers aloud together as tens and ones, like 34 is 3 tens and 4 ones.", resolvedAt: "2026-10-30" },
      { skill: "english.silent-e", skillName: "Silent e", subject: "english", count: 2, parentNote: null, resolvedAt: "2026-11-12" },
    ],
  },
  activity: { rounds: 46, days: 31, discoveries: 17, explored: 9 },
  // Same keys, params and English as server/services/learning/evidence.js and decisions.js.
  insights: [
    { key: "learn.insight.baseline_now", params: { subject: "english", subjectName: "English", fromPct: 60, fromN: 10, toPct: 80, toN: 20 }, text: "English: 60% right in the first 10 answers, 80% right in the last 20." },
    { key: "learn.insight.level_now", params: { subject: "english", subjectName: "English", from: 1, to: 2 }, text: "English: started at level 1, now at level 2." },
    { key: "learn.insight.baseline_now", params: { subject: "maths", subjectName: "Maths", fromPct: 55, fromN: 10, toPct: 85, toN: 20 }, text: "Maths: 55% right in the first 10 answers, 85% right in the last 20." },
    { key: "learn.insight.stage_reached", params: { subject: "maths", subjectName: "Maths", stage: 4, stageName: "reasoning" }, text: "Maths: the highest stage answered right without help is stage 4 (reasoning)." },
    { key: "learn.insight.independence_week", params: { week: "2026-11-16", independent: 20, total: 23, prevIndependent: 21, prevTotal: 25 }, text: "In the week of 2026-11-16, 20 of 23 right answers came without any help (the week before: 21 of 25)." },
    { key: "learn.insight.retention", params: { correct: 33, reviews: 41, pct: 80 }, text: "33 of 41 reviews were remembered (80%)." },
    { key: "learn.insight.misconceptions_resolved", params: { resolved: 2, seen: 3 }, text: "2 of 3 recurring mix-ups are now cleared up." },
    { key: "learn.insight.discoveries", params: { discoveries: 17 }, text: "17 everyday discovery questions answered." },
  ],
  decisions: [
    { at: "2026-11-18T16:20:00Z", type: "level_up", subject: "maths", skill: null, reason: { key: "learn.decision.level_up", params: { subject: "maths", subjectName: "Maths", from: 2, to: 3, acc: 0.88, n: 14, days: 3, pct: 88 }, text: "Moved up from level 2 to level 3 in Maths: 88% right over the last 14 answers, on 3 different days." } },
    { at: "2026-11-12T15:05:00Z", type: "mastered", subject: "english", skill: "english.silent-e", reason: { key: "learn.decision.mastered", params: { subject: "english", subjectName: "English", skill: "english.silent-e", skillName: "Silent e", items: 6, stage: 3 }, text: "Silent e mastered: right on 6 different questions, up to stage 3, and remembered on a later day." } },
    { at: "2026-11-06T17:40:00Z", type: "support_step", subject: "maths", skill: "maths.subtraction-regrouping", reason: { key: "learn.decision.support_up", params: { subject: "maths", subjectName: "Maths", skill: "maths.subtraction-regrouping", skillName: "Subtraction with regrouping", from: 0, to: 1, step: 1, misses: 2, strategy: "visual", strategyName: "pictures" }, text: "Subtraction with regrouping: now explained a different way (pictures) after 2 missed in a row." } },
  ],
};

// A learner who has only just started: every list empty, every count zero.
export const EMPTY_EVIDENCE = {
  baseline: {}, current: {}, byStage: {}, stageReached: [], independence: [],
  retention: { reviews: 0, correct: 0, rate: null, byWeek: [] },
  misconceptions: { seen: 0, resolved: 0, items: [] },
  activity: { rounds: 0, days: 0, discoveries: 0, explored: 0 },
  insights: [], decisions: [],
};
