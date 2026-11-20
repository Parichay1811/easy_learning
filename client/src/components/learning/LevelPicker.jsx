import { useId } from "react";
import { useTranslation } from "react-i18next";
import { SUBJECT_META, MAX_LEVEL, clampLevel, levelName, levelText } from "./levels";
import s from "./learning.module.css";

/**
 * Choose a level 0-8: a row of numbered steps (native radio buttons, so arrow
 * keys, Tab and screen readers work as usual) and, under it, the chosen
 * level's name and one plain sentence about it.
 *
 *   <LevelPicker legend="Maths level" subject="maths" value={2} current={2} max={5} onChange={setLevel} />
 *
 * Props: value, onChange(n), max (the highest level with content; default 8),
 * current (marks "now"), subject (colour), legend (visible), hideLegend, disabled.
 */
export default function LevelPicker({ value, onChange, max = MAX_LEVEL, current, subject, legend, hideLegend = false, disabled = false, className = "" }) {
  const { t } = useTranslation();
  const uid = useId();
  const top = clampLevel(max ?? MAX_LEVEL);
  const chosen = value == null ? null : clampLevel(value, top);
  const meta = SUBJECT_META[subject] || { color: "var(--d-accent)", soft: "var(--d-accent-soft)", ink: "var(--d-accent-ink)" };
  const levels = Array.from({ length: top + 1 }, (_, i) => i);
  const descId = `${uid}-desc`;
  return (
    <fieldset className={`${s.picker} ${className}`} disabled={disabled} style={{ "--lv": meta.color, "--lv-soft": meta.soft, "--lv-ink": meta.ink }}>
      <legend className={hideLegend ? s.srOnly : s.pickerLegend}>{legend || t("learning.picker.legend", "Choose a level")}</legend>
      <div className={s.steps}>
        {levels.map((n) => {
          const id = `${uid}-${n}`;
          const isNow = current != null && clampLevel(current) === n;
          return (
            <span key={n} className={s.step}>
              <input
                id={id}
                type="radio"
                className={s.stepInput}
                name={`${uid}-level`}
                value={n}
                checked={chosen === n}
                onChange={() => onChange?.(n)}
                aria-describedby={chosen === n ? descId : undefined}
              />
              <label htmlFor={id} className={s.stepLabel} data-now={isNow || undefined}>
                <span aria-hidden="true">{n}</span>
                <span className={s.srOnly}>
                  {t("learning.picker.option", { defaultValue: "Level {{n}}: {{name}}", n, name: levelName(t, n) })}
                  {isNow ? ` (${t("learning.picker.now", "now")})` : ""}
                </span>
              </label>
            </span>
          );
        })}
      </div>
      <div id={descId} className={s.pickDesc}>
        {chosen == null ? (
          <p className={s.muted}>{t("learning.picker.pick", "Pick a number to see what that level means.")}</p>
        ) : (
          <>
            <p className={s.pickName}>
              {t("learning.levelLabel", { defaultValue: "Level {{n}} · {{name}}", n: chosen, name: levelName(t, chosen) })}
              {current != null && clampLevel(current) === chosen && <span className={s.nowTag}>{t("learning.picker.nowTag", "Now")}</span>}
            </p>
            <p className={s.pickText}>{levelText(t, chosen)}</p>
          </>
        )}
        {top < MAX_LEVEL && <p className={s.pickNote}>{t("learning.picker.more", "Higher levels are on their way.")}</p>}
      </div>
    </fieldset>
  );
}
