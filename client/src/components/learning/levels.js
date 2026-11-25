// Words for the learning engine's numbers: levels 0-8 (a learning stage, never
// an age or a grade), level status, who set a level, skill states, pace.
// Plain, kind and the same for a child, a teenager, an adult and a grown-up
// looking on. No scores-as-labels, no rankings, no diagnosis words.
import { FaBook, FaCalculator, FaFlask } from "react-icons/fa";
import { weekRange } from "./weeks.js"; // with ".js": node --test loads this file too (evidence/model.test.mjs)

export const SUBJECTS = ["english", "maths", "science"];
export const MODULES = ["listen", "read", "write", "speak"];
export const MAX_LEVEL = 8;

// Fixed subject identities (same as components/dashboard/constants.js).
export const SUBJECT_META = {
  english: { color: "#8b5cf6", ink: "var(--d-english-ink, #6d28d9)", soft: "color-mix(in srgb, #8b5cf6 14%, var(--d-card, #fff))", Icon: FaBook, fallback: "English" },
  maths: { color: "#339af0", ink: "var(--d-maths-ink, #1864ab)", soft: "color-mix(in srgb, #339af0 14%, var(--d-card, #fff))", Icon: FaCalculator, fallback: "Maths" },
  science: { color: "#40c057", ink: "var(--d-science-ink, #237032)", soft: "color-mix(in srgb, #40c057 14%, var(--d-card, #fff))", Icon: FaFlask, fallback: "Science" },
};

// One short name and one plain sentence per level.
const LEVELS = [
  { name: "Getting started", text: "The very first steps, with lots of pictures, sounds and help." },
  { name: "First steps", text: "Simple everyday basics, one small step at a time." },
  { name: "Basic understanding", text: "Knows the basics and is starting to build on them." },
  { name: "Developing", text: "Using the basics with growing confidence." },
  { name: "Secure", text: "Comfortable with everyday work at this stage." },
  { name: "Independent", text: "Works most things out without help." },
  { name: "Stretching", text: "Takes on harder work with several steps." },
  { name: "Advanced", text: "Tackles challenging ideas and can explain them." },
  { name: "Expert", text: "The most challenging work Learnigo has." },
];

export const clampLevel = (n, max = MAX_LEVEL) => Math.max(0, Math.min(max, Math.round(Number(n) || 0)));

/** "Basic understanding" */
export function levelName(t, n) {
  const i = clampLevel(n);
  return t(`learning.level.${i}.name`, LEVELS[i].name);
}

/** "Knows the basics and is starting to build on them." */
export function levelText(t, n) {
  const i = clampLevel(n);
  return t(`learning.level.${i}.text`, LEVELS[i].text);
}

/** "Level 2 · Basic understanding" */
export function levelLabel(t, n) {
  return t("learning.levelLabel", { defaultValue: "Level {{n}} · {{name}}", n: clampLevel(n), name: levelName(t, n) });
}

export function subjectName(t, key) {
  if (!key) return "";
  return t(`subjectPage.${key}.label`, { defaultValue: SUBJECT_META[key]?.fallback || key.charAt(0).toUpperCase() + key.slice(1) });
}

export function moduleName(t, key) {
  if (!key) return "";
  return t(`subjectPage.modules.${key}.label`, { defaultValue: key.charAt(0).toUpperCase() + key.slice(1) });
}

/** How a level is going, in words. `who` = "me" (the learner) or "them" (a grown-up looking on). */
export function statusText(t, status, who = "me") {
  const me = who === "me";
  switch (status) {
    case "advancing": return me ? t("learning.status.me.advancing", "Nearly ready to move up") : t("learning.status.them.advancing", "Nearly ready to move up");
    case "practice": return me ? t("learning.status.me.practice", "Practising") : t("learning.status.them.practice", "Practising at this level");
    case "support": return me ? t("learning.status.me.support", "Building it up, step by step") : t("learning.status.them.support", "Getting extra help at this level");
    case "new": return me ? t("learning.status.me.new", "Just started") : t("learning.status.them.new", "Just started");
    default: return "";
  }
}

/** Who set the level, in words. */
export function sourceText(t, source, who = "me") {
  const me = who === "me";
  switch (source) {
    case "self": return me ? t("learning.source.me.self", "You chose this level") : t("learning.source.them.self", "Chosen by the learner");
    case "guardian": return me ? t("learning.source.me.guardian", "Set by a grown-up at home") : t("learning.source.them.guardian", "Set by a parent or carer");
    case "teacher": return me ? t("learning.source.me.teacher", "Set by your teacher") : t("learning.source.them.teacher", "Set by a teacher");
    case "baseline": return me ? t("learning.source.me.baseline", "From your warm-up questions") : t("learning.source.them.baseline", "From the warm-up questions");
    case "engine": return me ? t("learning.source.me.engine", "You moved up by practising") : t("learning.source.them.engine", "Moved up by Learnigo after steady practice");
    case "default": return me ? t("learning.source.me.default", "Your starting level") : t("learning.source.them.default", "Starting level");
    default: return "";
  }
}

/**
 * How a learner's own level came about, for the small line under it on "My
 * levels": Learnigo set it (from the warm-up, from their answers), or they
 * chose it. It is what makes "Adjust" read as optional.
 */
export function levelHowText(t, i18n, source) {
  switch (source) {
    // Short on purpose: one line on a phone, under each of three levels.
    case "engine": return tFresh(t, i18n, "learning.how.engine", "Set from your answers", "learning.source.me.engine");
    case "baseline": return tFresh(t, i18n, "learning.how.baseline", "Set from your warm-up", "learning.source.me.baseline");
    case "default": return sourceText(t, source, "me");
    default: return sourceText(t, source, "me");
  }
}

/** The kind sentence a learner sees when a grown-up has fixed a level (who: lockedBy or source). */
export function lockedText(t, source) {
  if (source === "teacher") return t("learning.locked.teacher", "Your teacher chose this level for you. If it feels too easy or too hard, tell them. They can change it.");
  return t("learning.locked.guardian", "A grown-up at home chose this level for you. If it feels too easy or too hard, tell them. They can change it.");
}

// Skill state -> glyph + word (colour never carries the meaning alone).
export const SKILL_STATES = ["mastered", "learning", "review_due", "new"];
export function skillStateText(t, state, who = "me") {
  const me = who === "me";
  switch (state) {
    case "mastered": return me ? t("learning.skillState.me.mastered", "Got it!") : t("learning.skillState.them.mastered", "Mastered");
    case "learning": return me ? t("learning.skillState.me.learning", "Learning") : t("learning.skillState.them.learning", "Learning");
    case "review_due": return me ? t("learning.skillState.me.review", "Time for a quick review") : t("learning.skillState.them.review", "Review due");
    case "new": return me ? t("learning.skillState.me.new", "New") : t("learning.skillState.them.new", "Not started");
    default: return "";
  }
}

export const PACES = ["gentle", "steady", "brisk"];
export function paceName(t, pace) {
  return {
    gentle: t("learning.pace.gentle", "Gentle"),
    steady: t("learning.pace.steady", "Steady"),
    brisk: t("learning.pace.brisk", "Brisk"),
  }[pace] || "";
}
export function paceText(t, pace) {
  return {
    gentle: t("learning.pace.gentleText", "More practice and review before anything new. Moves up only when it feels easy."),
    steady: t("learning.pace.steadyText", "A balance of practice and new things. The usual choice."),
    brisk: t("learning.pace.briskText", "Fewer repeats, new things sooner, for when it's going well."),
  }[pace] || "";
}

/** The subject of a skill id ("maths.subtraction-within-10" -> "maths"). */
export function skillSubject(skill) {
  const id = typeof skill === "string" ? skill : skill?.id || skill?.skill || "";
  const subj = skill?.subject || String(id).split(".")[0];
  return SUBJECTS.includes(subj) ? subj : null;
}

/** The translated skill name: t("skills.<id>", name). */
export function skillName(t, skill) {
  const id = typeof skill === "string" ? skill : skill?.id || skill?.skill;
  const fallback = (typeof skill === "object" && skill?.name) || (id ? String(id).split(".").pop().replace(/-/g, " ") : "");
  if (!id) return fallback;
  return t(`skills.${id}`, { defaultValue: fallback });
}

/**
 * Where to practise a skill: its subject and the best module we know of
 * (the skill's own modes, else the engine's "next" when it is the same skill,
 * else the subject page to pick a module). The skill id rides along as
 * ?skill= so the round can focus on it once the learning page reads it.
 */
export function practiseHref(skill, next) {
  const id = typeof skill === "string" ? skill : skill?.id || skill?.skill;
  const subject = skillSubject(skill) || next?.subject;
  if (!subject) return "/home";
  const modes = Array.isArray(skill?.modes) ? skill.modes.filter((m) => MODULES.includes(m)) : [];
  const module = skill?.module && MODULES.includes(skill.module) ? skill.module
    : modes[0] || (next && nextSkillId(next) === id && MODULES.includes(next.module) ? next.module : null);
  const q = id ? `?skill=${encodeURIComponent(id)}` : "";
  return module ? `/module/${module}/${subject}${q}` : `/subject/${subject}${q}`;
}

/** The skill of the engine's "next": an id string or { id, name }. */
export const nextSkillId = (next) => (typeof next?.skill === "string" ? next.skill : next?.skill?.id || null);

/** Where the engine's "next" goes. */
export function nextHref(next) {
  if (!next?.subject) return null;
  const skill = nextSkillId(next);
  if (MODULES.includes(next.module)) return `/module/${next.module}/${next.subject}${skill ? `?skill=${encodeURIComponent(skill)}` : ""}`;
  return `/subject/${next.subject}`;
}

/** Why this is next, in words (the engine sends a key; a sentence passes through). */
export function nextReason(t, reason) {
  if (!reason) return "";
  const known = {
    review: t("learning.next.review", "A quick review, so it stays fresh."),
    practice: t("learning.next.practice", "A little more practice on something you're learning."),
    new: t("learning.next.new", "Something new, when you're ready."),
    stretch: t("learning.next.stretch", "A small stretch: just a bit harder."),
    prerequisite: t("learning.next.prerequisite", "A step that makes the next thing easier."),
    continue: t("learning.next.continue", "Carry on where you left off."),
    baseline: t("learning.next.baseline", "A few warm-up questions to find your level."),
    start: t("learning.next.start", "A good place to start."),
  };
  return known[reason] || (/\s/.test(reason) ? reason : "");
}

/** "18 Nov" in the page's language. */
export function shortDate(dateish, lang) {
  if (!dateish) return "";
  try { return new Date(dateish).toLocaleDateString(lang || undefined, { day: "numeric", month: "short" }); } catch { return ""; }
}

/**
 * A week key ("2026-11-23", its Monday, or "2026-W48") -> the week's seven
 * days, "23–29 Nov" (weeks.js). Never the Monday alone: that reads as a date,
 * one day early for someone who played on the Tuesday.
 */
export function weekLabel(week, lang) {
  return weekRange(week, lang);
}

/**
 * Words that are newer than the locale files. English shows the new words
 * (`en`); another language shows its own older wording (`olderKey`) until
 * `key` is translated there, instead of an English phrase on its page.
 */
export function tFresh(t, i18n, key, en, olderKey, opts = {}) {
  const lng = String(i18n?.resolvedLanguage || i18n?.language || "en").split("-")[0];
  let own = false;
  try { own = i18n?.getResource?.(lng, "translation", key) != null; } catch { own = false; }
  if (lng === "en" || own || !olderKey) return t(key, { defaultValue: en, ...opts });
  return t(olderKey, opts);
}

// Weekly { week (local Monday), accuracy (0..1), attempts } from dated items, oldest first.
function weeksFrom(items, { at, right, total }, weeks) {
  const by = new Map();
  for (const it of items || []) {
    const when = new Date(at(it));
    if (Number.isNaN(when.getTime())) continue;
    const d = new Date(when.getFullYear(), when.getMonth(), when.getDate());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const w = by.get(key) || { week: key, right: 0, attempts: 0 };
    w.right += right(it);
    w.attempts += total(it);
    by.set(key, w);
  }
  return [...by.values()].sort((a, b) => a.week.localeCompare(b.week)).slice(-weeks)
    .map((w) => ({ week: w.week, accuracy: w.attempts ? w.right / w.attempts : null, attempts: w.attempts }));
}

/** Weekly totals from game rounds (10 questions each). */
export const weeksFromRounds = (rounds, weeks = 8) => weeksFrom(rounds, {
  at: (r) => r.completedAt || r.createdAt || r.date, right: (r) => Math.max(0, Math.min(10, Number(r.stars) || 0)), total: () => 10,
}, weeks);

/** Weekly totals from single answers ({ timestamp, correct }). */
export const weeksFromAnswers = (answers, weeks = 8) => weeksFrom(answers, {
  at: (a) => a.timestamp || a.createdAt, right: (a) => (a.correct ? 1 : 0), total: () => 1,
}, weeks);

/** Accuracy as a fraction, whatever the server sent (0..1 or 0..100). */
export function asFraction(v) {
  if (v == null || !Number.isFinite(Number(v))) return null;
  const n = Number(v);
  return n > 1 ? n / 100 : n;
}

/** The words for the engine's next step: { title, where, reason, href }. */
export function describeNext(t, next, skills = []) {
  if (!next?.subject) return null;
  const id = nextSkillId(next);
  const sk = id ? (skills || []).find((x) => (x.id || x.skill) === id) || { id, name: next.skill?.name || next.skillName } : null;
  const where = [subjectName(t, next.subject), next.module && moduleName(t, next.module)].filter(Boolean).join(" · ");
  return {
    title: sk ? skillName(t, sk) : where,
    where,
    reason: nextReason(t, next.reason),
    href: nextHref(next),
    subject: next.subject,
  };
}


export const newGoalId = () => `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** "What you can do at home" for a recurring difficulty, from whatever the server sent. */
export function homeNote(d) {
  return d?.parentNote || d?.parent_note || d?.atHome || d?.home || d?.analysis?.parent_note || d?.note || "";
}

/** "What to try" in class for a recurring difficulty. */
export function classNote(d) {
  return d?.teacherAction || d?.teacher_action || d?.teacherNote || d?.analysis?.teacher_action_if_missed || "";
}

/** Who set something and when, if the server says: { by, at }. */
export function changedBy(x) {
  if (!x || typeof x !== "object") return { by: "", at: null };
  const by = x.setByName || x.byName || x.updatedByName || (typeof x.setBy === "string" ? x.setBy : x.setBy?.name) || (typeof x.by === "string" ? x.by : x.by?.name) || (typeof x.updatedBy === "string" ? x.updatedBy : x.updatedBy?.name) || "";
  const at = x.setAt || x.at || x.updatedAt || x.changedAt || null;
  return { by, at };
}

/**
 * An engine suggestion in words: its translated key (learn.suggestion.*, the
 * engine's own English as the default) with skills named in this language.
 */
export function suggestionText(t, sg) {
  const params = {};
  for (const [k, v] of Object.entries(sg?.params || {})) params[k] = v && typeof v === "object" ? skillName(t, v) : v;
  return sg?.key ? t(`learn.suggestion.${sg.key}`, { ...params, defaultValue: sg.text || "" }) : sg?.text || "";
}

/** Who added a goal, for grown-ups: "" for their own. */
export function goalByText(t, by, viewer) {
  if (!by || by === viewer) return "";
  if (viewer === "learner") {
    if (by === "teacher") return t("learning.goals.fromYourTeacher", "from your teacher");
    if (by === "guardian") return t("learning.goals.fromHome", "from home");
    return "";
  }
  if (by === "learner") return t("learning.goals.byLearner", "their own goal");
  if (by === "teacher") return t("learning.goals.byTeacher", "from a teacher");
  if (by === "guardian") return t("learning.goals.byGuardian", "from home");
  return "";
}

/** A general tip when the question bank has no note for a tricky spot. */
export function generalTip(t, subject, role) {
  if (role === "teacher") {
    return {
      maths: t("learning.tip.teacher.maths", "Model one with objects or a number line, then let them try the next one aloud."),
      english: t("learning.tip.teacher.english", "Say a few examples together slowly, pointing at each word, then let them try one."),
      science: t("learning.tip.teacher.science", "Link it to something they can see or touch, then ask them to explain it back."),
    }[subject] || t("learning.tip.teacher.any", "Show one example step by step, then let them try the next one aloud.");
  }
  return {
    maths: t("learning.tip.home.maths", "Try one or two together with real things to count or move, and say each step out loud."),
    english: t("learning.tip.home.english", "Read or say a few examples together, slowly, pointing at the words."),
    science: t("learning.tip.home.science", "Spot it together in everyday life and talk about what you notice."),
  }[subject] || t("learning.tip.home.any", "Try one or two together, short and often, and talk about each step.");
}

/** Goals as the server takes them back: only { id, text, subject, target, done } (it knows who added each). */
export function goalsForServer(goals) {
  return (Array.isArray(goals) ? goals : []).filter((g) => g && g.text).map((g) => ({
    id: g.id, text: g.text, done: !!g.done,
    ...(g.subject ? { subject: g.subject } : {}),
    ...(Number.isInteger(g.target) ? { target: g.target } : {}),
  }));
}
