// Fixed identities used by every dashboard chart: a subject or module has the
// SAME colour everywhere. Use these instead of inventing colours.
import { FaHeadphones, FaBookOpen, FaPen, FaMicrophone } from 'react-icons/fa';
import { SUBJECT_ICON_IMAGES } from '../../data/subjectIcons';

export const SUBJECTS = [
  { key: 'english', label: 'English', world: 'English Kingdom', color: '#8b5cf6', ink: 'var(--d-english-ink)', fill: 'var(--d-english)', art: SUBJECT_ICON_IMAGES.english },
  { key: 'maths', label: 'Maths', world: 'Maths Galaxy', color: '#339af0', ink: 'var(--d-maths-ink)', fill: 'var(--d-maths)', art: SUBJECT_ICON_IMAGES.maths },
  { key: 'science', label: 'Science', world: 'Science Lab', color: '#40c057', ink: 'var(--d-science-ink)', fill: 'var(--d-science)', art: SUBJECT_ICON_IMAGES.science },
];

export const MODULES = [
  { key: 'listen', label: 'Listen', color: '#4dc9ff', ink: 'var(--d-listen-ink)', fill: 'var(--d-listen)', Icon: FaHeadphones },
  { key: 'read', label: 'Read', color: '#ff9d3b', ink: 'var(--d-read-ink)', fill: 'var(--d-read)', Icon: FaBookOpen },
  { key: 'write', label: 'Write', color: '#ff6b9d', ink: 'var(--d-write-ink)', fill: 'var(--d-write)', Icon: FaPen },
  { key: 'speak', label: 'Speak', color: '#6bcf7f', ink: 'var(--d-speak-ink)', fill: 'var(--d-speak)', Icon: FaMicrophone },
];

export const subjectOf = (key) => SUBJECTS.find((s) => s.key === key) || SUBJECTS[0];
export const moduleOf = (key) => MODULES.find((m) => m.key === key) || MODULES[0];

/** Translated label for a subject or module key. */
export const subjectLabel = (t, key) => t(`dash.subject.${key}`, { defaultValue: subjectOf(key).label });
export const moduleLabel = (t, key) => t(`dash.module.${key}`, { defaultValue: moduleOf(key).label });

/**
 * Mastery scale. `level` 0..3, glyph describes the fill amount so the level is
 * readable without colour. Kind wording on purpose: "Practising", not "Weak".
 */
export const MASTERY = [
  { key: 'notStarted', level: 0, label: 'Not started', bg: 'var(--d-m0)', ink: 'var(--d-m0-ink)' },
  { key: 'learning', level: 1, label: 'Learning', bg: 'var(--d-m1)', ink: 'var(--d-m1-ink)' },
  { key: 'practising', level: 2, label: 'Practising', bg: 'var(--d-m2)', ink: 'var(--d-m2-ink)' },
  { key: 'mastered', level: 3, label: 'Mastered', bg: 'var(--d-m3)', ink: 'var(--d-m3-ink)' },
];

export const masteryOf = (levelOrKey) =>
  MASTERY.find((m) => m.key === levelOrKey || m.level === levelOrKey) || MASTERY[0];

export const masteryLabel = (t, levelOrKey) => {
  const m = masteryOf(levelOrKey);
  return t(`dash.mastery.${m.key}`, { defaultValue: m.label });
};

/** Score (0..1 accuracy / mastery) -> mastery level. null/undefined -> not started. */
export function masteryFromScore(score) {
  if (typeof score !== 'number' || !Number.isFinite(score)) return MASTERY[0];
  if (score < 0.4) return MASTERY[1];
  if (score < 0.75) return MASTERY[2];
  return MASTERY[3];
}

/** Maximum points any chart will draw (D7). Aggregate on the server first. */
export const MAX_POINTS = 2000;
