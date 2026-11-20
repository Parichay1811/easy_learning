import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaPlus, FaTimes } from "react-icons/fa";
import { goalByText, newGoalId, subjectName } from "./levels";
import s from "./learning.module.css";

const MAX_GOALS = 10; // the server keeps at most 10
const MAX_LEN = 90;

/**
 * Simple personal goals: tick one off, add one, take one away. It only shows
 * the list and reports the new list; the page saves it.
 *
 *   <GoalList goals={goals} onChange={saveGoals} who="me" />
 *
 * Props: goals [{ id, text, subject?, target?, done, by? }], onChange(nextGoals), who "me" | "them",
 * viewer "learner" | "guardian" | "teacher" (who is looking: goals someone else added are
 * labelled, and a learner can tick a grown-up's goal but not remove it),
 * name (the learner's first name, for grown-ups' wording), disabled, compact (no help line).
 */
export default function GoalList({ goals = [], onChange, who = "me", viewer, name, disabled = false, compact = false, className = "" }) {
  const { t } = useTranslation();
  const uid = useId();
  const [text, setText] = useState("");
  const list = Array.isArray(goals) ? goals.filter((g) => g && g.text) : [];
  const me = who === "me";
  const looker = viewer || (me ? "learner" : "");
  const removable = (g) => !(looker === "learner" && g.by && g.by !== "learner");
  const full = list.length >= MAX_GOALS;

  const toggle = (g) => onChange?.(list.map((x) => (x.id === g.id ? { ...x, done: !x.done } : x)));
  const remove = (g) => onChange?.(list.filter((x) => x.id !== g.id));
  const add = (e) => {
    e.preventDefault();
    const clean = text.replace(/\s+/g, " ").trim().slice(0, MAX_LEN);
    if (!clean || full) return;
    onChange?.([...list, { id: newGoalId(), text: clean, done: false }]);
    setText("");
  };

  return (
    <div className={`${s.goals} ${className}`}>
      {list.length ? (
        <ul className={s.goalList}>
          {list.map((g) => {
            const id = `${uid}-${g.id}`;
            return (
              <li key={g.id} className={s.goalRow} data-done={g.done || undefined}>
                <input id={id} type="checkbox" className={s.goalCheck} checked={!!g.done} onChange={() => toggle(g)} disabled={disabled} />
                <label htmlFor={id} className={s.goalText}>
                  {g.text}
                  {g.subject && <span className={s.goalSubject}> · {subjectName(t, g.subject)}</span>}
                  {goalByText(t, g.by, looker) && <span className={s.goalBy}>{goalByText(t, g.by, looker)}</span>}
                </label>
                {removable(g) ? (
                  <button
                    type="button"
                    className={s.iconBtn}
                    onClick={() => remove(g)}
                    disabled={disabled}
                    data-sound="close"
                    aria-label={t("learning.goals.remove", { defaultValue: "Remove goal: {{goal}}", goal: g.text })}
                  >
                    <FaTimes aria-hidden="true" />
                  </button>
                ) : <span className={s.iconGap} aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={s.muted}>
          {me
            ? t("learning.goals.emptyMe", "No goals yet. A goal can be small, like \"Practise 3 times this week\".")
            : t("learning.goals.emptyThem", { defaultValue: "No goals yet. Add a small one together with {{name}}.", name: name || t("learning.theLearner", "the learner") })}
        </p>
      )}
      <form className={s.goalAdd} onSubmit={add}>
        <label htmlFor={`${uid}-new`} className={s.srOnly}>{me ? t("learning.goals.newMe", "A new goal for me") : t("learning.goals.newThem", "A new goal")}</label>
        <input
          id={`${uid}-new`}
          className={s.input}
          value={text}
          maxLength={MAX_LEN}
          onChange={(e) => setText(e.target.value)}
          placeholder={me ? t("learning.goals.phMe", "My next goal…") : t("learning.goals.phThem", "e.g. Read a short story every day")}
          disabled={disabled || full}
          autoComplete="off"
        />
        <button type="submit" className={s.addBtn} disabled={disabled || full || !text.trim()}>
          <FaPlus aria-hidden="true" /> <span>{t("learning.goals.add", "Add")}</span>
        </button>
      </form>
      {!compact && full && <p className={s.muted}>{t("learning.goals.full", "That's plenty of goals. Tick some off first!")}</p>}
    </div>
  );
}
