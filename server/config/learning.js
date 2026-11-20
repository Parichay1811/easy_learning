// Adaptive learning engine policy (docs/learning/ADAPTIVE.md).
//
// These numbers are a STARTING policy, not truth: tune them here, the engine
// (services/learning/*) reads nothing else. Every rule that uses them has a
// unit test in test/learning-*.test.js.
//
// Fixed rules that are NOT configurable (they are promises to learners):
//   - a level is never lowered automatically (sustained difficulty becomes a suggestion);
//   - response time, uncertain speech, ungraded items and accommodations never lower anything;
//   - a correct answer never lowers a skill's mastery;
//   - a level locked by a guardian or teacher never moves on its own.

const SUBJECTS = ['english', 'maths', 'science']
const MODULES = ['listen', 'read', 'write', 'speak']
const MIN_LEVEL = 0
const MAX_LEVEL = 8

module.exports = {
  SUBJECTS,
  MODULES,
  MIN_LEVEL,
  MAX_LEVEL,
  // Where a learner starts in a subject before any evidence (or a baseline / own choice).
  defaultLevel: 1,

  // ── Level policy (per subject) ─────────────────────────────────────────────
  thresholds: {
    advance: 0.85, // accuracy at the level >= this -> "advancing"
    practice: 0.6, // 0.60..0.84 -> "practice"; below -> "support"
  },
  // Before an automatic advance: this many graded attempts at the current level...
  minAttemptsToAdvance: 12,
  // ...spread over at least this many different days (sessions).
  minDaysToAdvance: 2,
  // The accuracy is the mean credit of the last N graded attempts at the level.
  levelWindow: 20,
  // Below this many attempts the status is "new" (no label from a handful of answers).
  minAttemptsForStatus: 5,
  // Sustained support -> a level_down SUGGESTION (never an automatic change).
  supportSuggest: { minAttempts: 10, minDays: 2 },
  // A dismissed suggestion is not offered again for this many days.
  suggestionSnoozeDays: 7,

  // ── Credit per graded attempt ───────────────────────────────────────────────
  // Independent = first try and no hint asked for (the scaffold a support
  // strategy shows up front is not a hint). It weighs most.
  credit: {
    independent: 1,
    assisted: 0.75, // correct, but with a hint or on a later try
    close: 0.5, // e.g. one letter off
    incorrect: 0,
  },
  // Exponential moving average for a skill's mastery (0..1).
  masteryRate: { independent: 0.35, assisted: 0.2, close: 0.2, incorrect: 0.25 },
  // A skill is "mastered" at this mastery once it has been recalled on two separate days (box >= 2).
  masteredAt: 0.85,
  masteredMinBox: 2,
  // "Needs practice" lists skills below this with at least `needsPracticeMinAttempts` attempts.
  needsPracticeBelow: 0.6,
  needsPracticeMinAttempts: 3,

  // Answers from these modes never feed the engine (timed games: time must never lower anything).
  ignoreModes: ['warrior', 'baseline'],

  // ── Spaced repetition: Leitner boxes 0..5 and their intervals in days ───────
  leitnerDays: [0, 1, 3, 7, 14, 30],

  // ── Teaching escalation per skill (supportStep) ─────────────────────────────
  // 0 words/numbers (hint 1) -> 1 pictures/objects (visual + worked example) ->
  // 2 guided step by step (all hints, read aloud) -> 3 an easier related item
  // next (prerequisite) -> 4 park it, reassess later (review due tomorrow).
  strategies: ['words', 'visual', 'guided', 'simpler', 'reassess'],
  // Misses in a row at one step before the approach changes.
  missesPerStep: 1,
  // A parked skill comes back for reassessment after this many days.
  parkDays: 1,

  // ── Feedback ──────────────────────────────────────────────────────────────
  // "You remembered this from yesterday" needs a real miss at least this long before.
  rememberMinHours: 20,
  rememberYesterdayMaxHours: 48,
  // A short break is suggested after this many misses within the last `breakWindow` answers of one sitting.
  breakMisses: 4,
  breakWindow: 6,
  sessionGapMinutes: 30,

  // ── Rounds ────────────────────────────────────────────────────────────────
  round: {
    defaultSize: 10,
    minSize: 3,
    maxSize: 20,
    // How a round of 10 is split, by pace (scaled to other sizes). New items fill what is left.
    mix: {
      gentle: { review: 3, practice: 4, stretch: 1, prerequisite: 2 },
      steady: { review: 2, practice: 3, stretch: 1, prerequisite: 2 },
      brisk: { review: 2, practice: 2, stretch: 2, prerequisite: 1 },
    },
    // Items answered this recently are not repeated (except as reviews) while others exist.
    recentHours: 12,
    recentKeep: 60,
  },

  // Mirror of PREF_FIELDS in client/src/utils/learnerPrefs.js (test/learning-config.test.js keeps them in step).
  // Preferences only: no diagnosis, nothing here ever changes a level.
  SUPPORT_FIELDS: [
    { key: 'uiSounds', type: 'bool' },
    { key: 'hoverSounds', type: 'bool' },
    { key: 'soundVolume', type: 'range', min: 0.2, max: 1 },
    { key: 'haptics', type: 'bool' },
    { key: 'voice', type: 'bool' },
    { key: 'voiceRate', type: 'range', min: 0.7, max: 1.2 },
    { key: 'autoRead', type: 'bool' },
    { key: 'captions', type: 'bool' },
    { key: 'font', type: 'choice', options: ['default', 'readable', 'dyslexic'] },
    { key: 'textScale', type: 'range', min: 1, max: 1.5 },
    { key: 'spacing', type: 'choice', options: ['normal', 'wide'] },
    { key: 'contrast', type: 'choice', options: ['normal', 'high'] },
    { key: 'motion', type: 'choice', options: ['system', 'full', 'reduced'] },
    { key: 'focusMode', type: 'bool' },
    { key: 'bigTargets', type: 'bool' },
    { key: 'timer', type: 'choice', options: ['on', 'relaxed', 'off'] },
    { key: 'breakEvery', type: 'choice', options: [0, 10, 15, 20, 30] },
    { key: 'speakInstead', type: 'choice', options: ['ask', 'type', 'choose'] },
  ],

  PACES: ['gentle', 'steady', 'brisk'],
  AGE_BANDS: ['child', 'teen', 'adult'],
  OVERRIDE_TYPES: ['hold_level', 'skip_skill', 'focus_skill'],
  LEVEL_SOURCES: ['default', 'baseline', 'self', 'guardian', 'teacher', 'engine'],
  limits: { goals: 10, goalText: 120, overrides: 30, misconceptions: 3, misconceptionText: 160, history: 26 },
}
