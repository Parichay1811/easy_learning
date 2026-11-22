// Words for the learner's journey (contract §2-3): the server sends English
// `text` plus a `key` and `params`; the page says it in the learner's
// language with t(key, { defaultValue: text, ...params }), naming skills,
// subjects and modules in that language too.
import i18next from "i18next";
import {
  FaPlay, FaRedo, FaHandsHelping, FaSeedling, FaMountain, FaLightbulb, FaCompass,
} from "react-icons/fa";

export const SUBJECTS = ["english", "maths", "science"];
export const MODULES = ["listen", "read", "write", "speak"];

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
export const subjectLabel = (t, key) => (key ? t(`subjectPage.${key}.label`, { defaultValue: cap(key) }) : "");
export const moduleLabel = (t, key) => (key ? t(`subjectPage.modules.${key}.label`, { defaultValue: cap(key) }) : "");
export const skillLabel = (t, id, name) => (id ? t(`skills.${id}`, { defaultValue: name || id }) : name || "");

// How the engine names a module and a teaching approach in its sentences.
const MODULE_WORDS = { listen: "Listening", read: "Reading", write: "Writing", speak: "Speaking" };
const STRATEGY_WORDS = { words: "words", visual: "pictures", guided: "step by step", simpler: "an easier one first", reassess: "a rest" };

/**
 * The params of a server message, with every name said in the learner's
 * language (ids stay as they are): skillName / forName / fromName from
 * skills.<id>, subjectName, moduleName, strategyName.
 */
export function shownParams(t, params) {
  const p = params && typeof params === "object" ? { ...params } : {};
  if (p.skill || p.skillName) p.skillName = skillLabel(t, p.skill, p.skillName);
  if (p.forSkill || p.forName) p.forName = skillLabel(t, p.forSkill, p.forName);
  if (p.from && typeof p.from === "string" && p.fromName) p.fromName = skillLabel(t, p.from, p.fromName);
  if (typeof p.subject === "string" && SUBJECTS.includes(p.subject)) p.subjectName = subjectLabel(t, p.subject);
  if (typeof p.module === "string" && MODULES.includes(p.module)) {
    p.moduleName = t(`journey.module.${p.module}`, { defaultValue: p.moduleName || MODULE_WORDS[p.module] });
  }
  // A day ("2026-11-21") said the way the learner's language says dates.
  if (typeof p.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.date)) {
    try { p.date = new Date(`${p.date}T12:00:00Z`).toLocaleDateString(i18next.language || undefined, { day: "numeric", month: "long", timeZone: "UTC" }); } catch { /* keep it */ }
  }
  if (typeof p.strategy === "string" && STRATEGY_WORDS[p.strategy]) {
    p.strategyName = t(`journey.strategy.${p.strategy}`, { defaultValue: p.strategyName || STRATEGY_WORDS[p.strategy] });
  }
  return p;
}

/** { key, params, text } -> words in the learner's language ("" when there is nothing). */
export function msgText(t, msg, fallback = "") {
  if (!msg) return fallback;
  if (typeof msg === "string") return msg;
  const text = typeof msg.text === "string" ? msg.text : fallback;
  if (!msg.key) return text;
  return t(msg.key, { ...shownParams(t, msg.params), defaultValue: text });
}

/**
 * The language a translated string is really in, for the voice: the site's
 * language when `key` is translated there, else English (t() fell back to the
 * English words). A French voice must never read English words, nor the reverse.
 */
export function langOfKey(i18n, key) {
  const lng = String(i18n?.resolvedLanguage || i18n?.language || "en").split("-")[0];
  if (lng === "en" || !key) return lng;
  try {
    return i18n.getResource(lng, "translation", key) != null ? lng : "en";
  } catch {
    return "en";
  }
}

/** An address inside the site only (never another site, never javascript:). */
export function safeHref(href) {
  if (typeof href !== "string") return null;
  const h = href.trim();
  if (!h.startsWith("/") || h.startsWith("//") || h.includes("\\")) return null;
  return h;
}

// Where a round was chosen from (the engine counts the learner's own choices: ?source= on the round).
export const SOURCES = ["next", "welcome", "journey", "explore", "challenge", "discovery"];
function withSource(href, source) {
  if (!href || !SOURCES.includes(source) || /[?&]source=/.test(href)) return href;
  return `${href}${href.includes("?") ? "&" : "?"}source=${source}`;
}

/** Where an action goes: its own href, else built from subject / module / skill / mode (+ its `source`). */
export function actionHref(action, kind) {
  return withSource(baseHref(action, kind), action?.source);
}
function baseHref(action, kind) {
  const own = safeHref(action?.href);
  if (own) return own;
  const subject = SUBJECTS.includes(action?.subject) ? action.subject : null;
  const module = MODULES.includes(action?.module) ? action.module : null;
  const skill = typeof action?.skill === "string" ? action.skill : action?.skill?.id;
  if (kind === "discovery" || action?.mode === "discovery") return "/discovery";
  if (!subject) return null;
  const qs = new URLSearchParams();
  if (skill) qs.set("skill", skill);
  if (kind === "challenge" || action?.mode === "challenge") {
    qs.set("challenge", "1");
    if (!module) return `/discovery?${new URLSearchParams({ challenge: "1", subject, ...(skill ? { skill } : {}) })}`;
  }
  const q = qs.toString();
  return module ? `/module/${module}/${subject}${q ? `?${q}` : ""}` : `/subject/${subject}`;
}

// What each kind of "next" looks like (icon, colours from the dashboard tokens).
export const KIND_META = {
  continue: { Icon: FaPlay, bg: "var(--d-coral-soft)", fg: "var(--d-coral-ink)" },
  review: { Icon: FaRedo, bg: "var(--d-sky-soft)", fg: "var(--d-sky-ink)" },
  support: { Icon: FaHandsHelping, bg: "var(--d-teal-soft)", fg: "var(--d-teal-ink)" },
  next: { Icon: FaSeedling, bg: "var(--d-grass-soft)", fg: "var(--d-grass-ink)" },
  challenge: { Icon: FaMountain, bg: "var(--d-grape-soft)", fg: "var(--d-grape-ink)" },
  discovery: { Icon: FaLightbulb, bg: "var(--d-sun-soft)", fg: "var(--d-sun-ink)" },
  explore: { Icon: FaCompass, bg: "var(--d-berry-soft)", fg: "var(--d-berry-ink)" },
};
export const kindMeta = (kind) => KIND_META[kind] || KIND_META.next;

// The default title of each kind (the server's own title wins).
export function kindTitle(t, kind) {
  switch (kind) {
    case "continue": return t("journey.next.kind.continue", "Continue your adventure");
    case "review": return t("journey.next.kind.review", "Keep it fresh");
    case "support": return t("journey.next.kind.support", "Strengthen a building block");
    case "challenge": return t("journey.next.kind.challenge", "Mini challenge");
    case "discovery": return t("journey.next.kind.discovery", "Today's quick discovery");
    case "explore": return t("journey.next.kind.explore", "Explore something new");
    default: return t("journey.next.kind.next", "Your next step");
  }
}

// Stages 0-5: the kind of thinking a question asks for (not a level).
// Short names (they sit under small stops on a phone) and one plain line each.
const STAGES = [
  { name: "Wonder", text: "Wondering about everyday things" },
  { name: "Spot it", text: "Recognising and remembering" },
  { name: "Get it", text: "Understanding what it means" },
  { name: "Use it", text: "Using it to solve problems" },
  { name: "Explain it", text: "Working out why" },
  { name: "Stretch it", text: "Using it somewhere new" },
];
export const STAGE_COUNT = STAGES.length;
export const stageName = (t, n) => t(`journey.stage.${n}.name`, STAGES[n]?.name || String(n));
export const stageText = (t, n) => t(`journey.stage.${n}.text`, STAGES[n]?.text || "");

/* ── Growth badges (category "growth" in the achievements list) ───────────── */

export const isGrowth = (a) => a?.category === "growth" || String(a?.id || "").startsWith("growth_");

export function badgeName(t, a) {
  if (isGrowth(a)) return t(`learn.achievement.${a.id}.name`, { ...shownParams(t, a.params), defaultValue: a.name || a.text || a.id });
  return t(`dashboard.achievements.${a.id}.name`, { defaultValue: a.name || a.id });
}
// The server's desc is { key, params ({ count }), text }; older lists only have `description`.
export function badgeDesc(t, a) {
  if (isGrowth(a) && a.desc && typeof a.desc === "object") return msgText(t, a.desc, a.description || "");
  if (isGrowth(a)) return t(`learn.achievement.${a.id}.desc`, { defaultValue: a.description || "" });
  return t(`dashboard.achievements.${a.id}.description`, { defaultValue: a.description || "" });
}
/** What the learner did to earn it ("You explored 3 new ideas"), or "". */
export function badgeEvidence(t, a) {
  const ev = a?.evidence;
  if (!ev) return "";
  if (typeof ev === "string") return ev;
  if (typeof ev !== "object") return "";
  const text = typeof ev.text === "string" ? ev.text : "";
  const key = ev.key || (a.id ? `learn.achievement.${a.id}.evidence` : null);
  if (!key) return text;
  return t(key, { ...shownParams(t, ev.params), defaultValue: text });
}
// A friendly picture for a growth badge when the server sends none.
const GROWTH_ICON = {
  growth_first_discovery: "🔎",
  growth_concept_explorer: "🧭",
  growth_comeback: "🌱",
  growth_three_mastered: "🌳",
  growth_curious: "💡",
  growth_problem_solver: "🧩",
  growth_review_champion: "🔁",
};
export const badgeIcon = (a) => a?.icon || GROWTH_ICON[a?.id] || "🏅";

/* ── The journey map (GET /api/learn/journey) ─────────────────────────────── */

const count = (v) => (Array.isArray(v) ? v.length : Math.max(0, Math.round(Number(v) || 0)));

/**
 * The server's journey (GET /api/learn/journey) as a list of subjects, each
 * { subject, level, ceiling, stages: [{ stage, skills, mastered, attempted }] (0-5), reached }.
 * Accepts { subjects: {..} | [..] }, { journey: .. } or the subjects at the top.
 */
export function normalizeJourney(json) {
  if (!json || typeof json !== "object") return [];
  const src = json.subjects ?? json.journey ?? json;
  const entries = Array.isArray(src)
    ? src.map((x) => [x?.subject, x])
    : Object.entries(src).filter(([k]) => SUBJECTS.includes(k));
  return entries
    .filter(([subject, x]) => SUBJECTS.includes(subject) && x && Array.isArray(x.stages))
    .map(([subject, x]) => {
      const stages = Array.from({ length: STAGE_COUNT }, (_, n) => {
        const st = x.stages.find((y) => Number(y?.stage) === n) || {};
        const skills = count(st.skills);
        const mastered = Math.min(skills || Infinity, count(st.mastered));
        const attempted = Math.max(count(st.attempted), mastered);
        // Skills that only have practice (ungraded) questions at this stage: nothing to master there yet.
        const practiceOnly = count(st.practiceOnly);
        return { stage: n, skills, practiceOnly, mastered: skills ? mastered : 0, attempted: skills ? attempted : 0 };
      });
      // Where the learner has got to: the server's word, else the furthest stage with a skill mastered.
      let reached = Number.isInteger(x.reached) ? x.reached : Number.isInteger(x.reached?.stage) ? x.reached.stage : null;
      if (reached == null) {
        const done = stages.filter((st) => st.mastered > 0).map((st) => st.stage);
        reached = done.length ? Math.max(...done) : null;
      }
      return { subject, level: Number.isInteger(x.level) ? x.level : null, ceiling: x.ceiling ?? null, stages, reached };
    })
    .sort((a, b) => SUBJECTS.indexOf(a.subject) - SUBJECTS.indexOf(b.subject));
}
