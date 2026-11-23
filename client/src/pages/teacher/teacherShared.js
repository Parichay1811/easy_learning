// Non-component helpers shared by the teacher pages.
import { useEffect, useState } from "react";
import { SUBJECTS, MODULES, today, toISO } from "../../components/dashboard";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { apiCall, pctToFraction } from "./teacherApi";

export const GROUP_COLORS = ["#339af0", "#8b5cf6", "#40c057", "#ff9d3b", "#f06595", "#20c997", "#fab005", "#e8590c"];
export const GROUP_EMOJIS = ["🧮", "📚", "🔬", "✏️", "🎧", "🗣️", "🌍", "🎨", "🚀", "🌱", "⭐", "🦉"];

export const groupStyle = (g) => ({ "--group": g?.color || "var(--d-accent)" });

export const RISK_TEXT = {
  inactive: "No learning for a week",
  accuracy_drop: "Accuracy fell this week",
  // The check-in reasons of services/learnerInsights.js (Today and the group view share them).
  not_started: "Has not started yet",
  first_try_down: "Fewer right on the first try than the week before",
  first_try_down_level: "Fewer right on the first try after moving up a level",
  stuck: "Finding {{skill}} tricky",
};

// Friendly text for a 402 limit or locked module answer.
export function limitText(t, r) {
  if (r?.code === "PLAN_LIMIT") return r.message || t("teacher.limit.generic", { defaultValue: "You've reached your plan's limit." });
  if (r?.code === "MODULE_LOCKED") return t("teacher.limit.module", { defaultValue: "This is part of a bigger plan." });
  return r?.message || t("teacher.error", { defaultValue: "Something went wrong. Please try again." });
}

// The kit's time range as the shared analytics endpoints' query string.
// Days after today are cut off, so "this week" does not end in empty future days.
export const rangeQuery = (tr) => {
  const now = toISO(today());
  const to = tr.to > now ? now : tr.to;
  const from = tr.from > to ? to : tr.from;
  return `from=${from}&to=${to}&cmp=${tr.cmp === "yoy" ? "lastyear" : tr.cmp || "prev"}`;
};

// An accuracy change is only shown with enough answers on both sides (the same minimum as
// "At a glance", services/learnerInsights.js RULES.minAnswers): a handful of answers is noise.
// It must also be bigger than the usual ups and downs: at least 8 points and more than twice the
// standard error of the difference of the two shares (the same rule, RULES.minChangePoints / noise).
export const MIN_ANSWERS_FOR_CHANGE = 20;
export function enoughToCompare(o) {
  const c = o?.totals, p = o?.previous;
  if (!c || !p || (c.answered ?? 0) < MIN_ANSWERS_FOR_CHANGE || (p.answered ?? 0) < MIN_ANSWERS_FOR_CHANGE) return false;
  const a = c.correct / c.answered, b = p.correct / p.answered;
  const se = Math.sqrt((a * (1 - a)) / c.answered + (b * (1 - b)) / p.answered);
  return Math.abs(a - b) >= 0.08 && Math.abs(a - b) > 2 * se;
}
export const solidInsights = (o) => (o?.insights || []).filter((i) => !["accuracy_up", "accuracy_down"].includes(i.key) || enoughToCompare(o));

const LEVEL = { not_started: "notStarted", learning: "learning", practising: "practising", mastered: "mastered" };

// Server subject x module matrix -> SubjectModuleMatrix cells.
export const matrixCells = (matrix) => SUBJECTS.flatMap((sub) => MODULES.map((m) => {
  const c = matrix?.[sub.key]?.[m.key];
  return { subject: sub.key, module: m.key, accuracy: c?.answered ? pctToFraction(c.accuracy) : null, minutes: c?.minutes || 0, level: LEVEL[c?.mastery] || "notStarted" };
}));

// Enter another of my workspaces (TCH-003) and keep the new token.
export function useSwitchWorkspace() {
  const { getTeacherToken, teacherUseToken } = useAdminAuth();
  return async (tutorId) => {
    const r = await apiCall("/teacher/auth/switch", { token: getTeacherToken(), method: "POST", body: { tutorId } });
    if (r.ok) teacherUseToken(r.token, r.adminToken);
    return r;
  };
}

/** True while a media query matches (e.g. narrow screens get sub-tabs instead of side-by-side cards). */
export function useMedia(query) {
  const [match, setMatch] = useState(() => (typeof window !== "undefined" ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}
