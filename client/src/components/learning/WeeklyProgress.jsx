import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import TrendLine from "../dashboard/charts/TrendLine";
import { asFraction, weekLabel } from "./levels";
import s from "./learning.module.css";

// "2026-W47" -> the Monday's ISO date, so the chart can name the week.
function weekISO(week) {
  const w = String(week ?? "");
  if (/^\d{4}-\d{2}-\d{2}/.test(w)) return w.slice(0, 10);
  const m = /^(\d{4})-W(\d{1,2})$/.exec(w);
  if (!m) return w;
  const jan4 = Date.UTC(Number(m[1]), 0, 4);
  const monday = new Date(jan4 - ((new Date(jan4).getUTCDay() + 6) % 7) * 86400000 + (Number(m[2]) - 1) * 7 * 86400000);
  return monday.toISOString().slice(0, 10);
}

/**
 * Week by week: the share of right answers as a calm line, and how many
 * answers there were. Never compared with anyone else.
 *
 *   <WeeklyProgress history={[{ week: "2026-11-16", accuracy: 0.8, attempts: 30 }]} who="me" />
 *
 * Props: history [{ week, accuracy (0..1 or 0..100), attempts }], who "me" | "them", name, height.
 */
export default function WeeklyProgress({ history = [], who = "me", name, height = 200, className = "" }) {
  const { t, i18n } = useTranslation();
  const rows = useMemo(() => (history || [])
    .filter((h) => h && h.week != null)
    .map((h) => ({ x: weekISO(h.week), value: asFraction(h.accuracy), attempts: Number(h.attempts) || 0, label: weekLabel(h.week, i18n.language) })),
  [history, i18n.language]);
  const answered = rows.filter((r) => r.attempts > 0);
  const me = who === "me";

  if (!answered.length) {
    return (
      <p className={`${s.muted} ${className}`}>
        {me
          ? t("learning.weekly.emptyMe", "Your weeks will show here once you've played a few rounds.")
          : t("learning.weekly.emptyThem", { defaultValue: "Weeks show here once {{name}} has answered some questions.", name: name || t("learning.theLearner", "the learner") })}
      </p>
    );
  }

  const last = answered[answered.length - 1];
  const prev = answered.length > 1 ? answered[answered.length - 2] : null;
  return (
    <div className={`${s.weekly} ${className}`}>
      <TrendLine
        data={rows.map((r) => ({ x: r.x, value: r.value }))}
        unit="%"
        height={height}
        seriesLabel={t("learning.weekly.series", "Right answers")}
        label={me ? t("learning.weekly.labelMe", "My right answers, week by week") : t("learning.weekly.labelThem", "Right answers, week by week")}
      />
      <ul className={s.weekAnswers} aria-label={t("learning.weekly.answersLabel", "Answers each week")}>
        {rows.slice(-8).map((r) => (
          <li key={r.x}>
            <span className={s.weekName}>{r.label}</span>
            <b>{r.attempts}</b>
            <span className={s.srOnly}>{t("learning.weekly.answersSr", { defaultValue: "{{count}} answers", count: r.attempts })}</span>
          </li>
        ))}
      </ul>
      <p className={s.weekNote}>
        {prev
          ? t("learning.weekly.lastTwo", { defaultValue: "Latest week: {{n}} answers. The week before: {{m}}.", n: last.attempts, m: prev.attempts })
          : t("learning.weekly.lastOne", { defaultValue: "Latest week: {{n}} answers.", n: last.attempts })}
        {" "}
        {t("learning.weekly.calm", "Ups and downs are normal: new things often feel harder at first.")}
      </p>
    </div>
  );
}
