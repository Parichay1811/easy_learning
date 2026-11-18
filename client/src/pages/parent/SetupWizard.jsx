import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, fmtDuration } from "../../components/dashboard";
import s from "./parent.module.css";

const LANGS = [["en", "English"], ["de", "Deutsch"], ["fr", "Français"], ["es", "Español"], ["it", "Italiano"], ["nl", "Nederlands"], ["hi", "हिन्दी"], ["ar", "العربية"]];

// First-run setup (PAR-004): three skippable steps that end on the dashboard.
export default function SetupWizard({ api, child, onClose }) {
  const { t, i18n } = useTranslation();
  const T = (k, d, o) => t(`parent.setup.${k}`, { defaultValue: d, ...o });
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    age: child.age || "", grade: child.grade || "", language: child.language || (i18n.language || "en").slice(0, 2),
    minutesPerDay: child.weeklyGoal?.minutesPerDay || 20, daysPerWeek: child.weeklyGoal?.daysPerWeek || 5,
    weeklyDigest: child.notifyPrefs?.weeklyDigest ?? true, milestones: child.notifyPrefs?.milestones ?? true,
    goalReached: child.notifyPrefs?.goalReached ?? true, inactivity: child.notifyPrefs?.inactivity ?? false,
  });
  const [error, setError] = useState("");
  const first = child.name.split(" ")[0];
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const finish = async () => {
    const r = await api.patch(`/children/${child._id}/settings`, {
      age: Number(form.age) || child.age, grade: form.grade, language: form.language,
      weeklyGoal: { minutesPerDay: Number(form.minutesPerDay), daysPerWeek: Number(form.daysPerWeek), reward: child.weeklyGoal?.reward || "", rewardEmoji: child.weeklyGoal?.rewardEmoji || "" },
      notifyPrefs: { weeklyDigest: form.weeklyDigest, milestones: form.milestones, goalReached: form.goalReached, inactivity: form.inactivity },
      onboarded: true,
    });
    if (!r.success) return setError(r.message);
    onClose(true);
  };

  const steps = [
    <div key="a" className={s.stack}>
      <p className={s.muted}>{T("aWhy", "So suggestions fit {{name}}'s level.", { name: first })}</p>
      <div className={s.formGrid}>
        <label className={s.field}>{T("age", "Age")}<input className={s.input} type="number" min={1} max={25} value={form.age} onChange={(e) => set("age", e.target.value)} /></label>
        <label className={s.field}>{T("grade", "School year or grade")}<input className={s.input} value={form.grade} onChange={(e) => set("grade", e.target.value)} placeholder={T("gradePh", "e.g. Year 3")} maxLength={30} /></label>
        <label className={s.field} style={{ gridColumn: "1 / -1" }}>{T("lang", "Preferred language")}
          <select className={s.select} value={form.language} onChange={(e) => set("language", e.target.value)}>
            {LANGS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>
    </div>,
    <div key="b" className={s.stack}>
      <p className={s.muted}>{T("bWhy", "A small, regular goal works better than a big one. {{name}} sees it on their home screen.", { name: first })}</p>
      <div className={s.formGrid}>
        <label className={s.field}>{T("minutes", "Minutes a day")}
          <select className={s.select} value={form.minutesPerDay} onChange={(e) => set("minutesPerDay", e.target.value)}>
            {[5, 10, 15, 20, 30, 45].map((m) => <option key={m} value={m}>{fmtDuration(m)}</option>)}
          </select>
        </label>
        <label className={s.field}>{T("days", "Days a week")}
          <select className={s.select} value={form.daysPerWeek} onChange={(e) => set("daysPerWeek", e.target.value)}>
            {[2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
    </div>,
    <div key="c" className={s.stack}>
      <p className={s.muted}>{T("cWhy", "What would you like to hear about? Only you get these; other guardians choose their own.")}</p>
      {[["weeklyDigest", T("digest", "A short weekly summary")], ["milestones", T("ms", "Milestones and new badges")], ["goalReached", T("goal", "When the weekly goal is reached")], ["inactivity", T("inactive", "A gentle nudge after a quiet week")]].map(([k, l]) => (
        <label key={k} className={s.check}><input type="checkbox" checked={form[k]} onChange={(e) => set(k, e.target.checked)} />{l}</label>
      ))}
    </div>,
  ];
  const titles = [T("t1", "About {{name}}", { name: first }), T("t2", "A weekly goal"), T("t3", "Notifications")];

  return (
    <div className={s.backdrop} role="presentation">
      <div className={s.sheet} role="dialog" aria-modal="true" aria-labelledby="setup-h">
        <div className={s.sheetHead}>
          <div>
            <p className={`${s.muted} ${s.small}`} style={{ margin: 0 }}>{T("step", "Step {{n}} of 3", { n: step + 1 })}</p>
            <h2 id="setup-h">{titles[step]}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onClose(false)}>{T("skipAll", "Skip for now")}</Button>
        </div>
        {steps[step]}
        {error && <p className={s.error} role="alert">{error}</p>}
        <div className={s.spread} style={{ marginTop: 18 }}>
          {step > 0 ? <Button variant="ghost" onClick={() => setStep(step - 1)}>{T("back", "Back")}</Button> : <span />}
          <span className={s.row}>
            {step < 2 && <Button variant="soft" onClick={() => setStep(step + 1)}>{T("skip", "Skip")}</Button>}
            {step < 2 ? <Button onClick={() => setStep(step + 1)}>{T("next", "Next")}</Button> : <Button onClick={finish}>{T("finish", "Finish")}</Button>}
          </span>
        </div>
      </div>
    </div>
  );
}
