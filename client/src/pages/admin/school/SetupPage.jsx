// ADM-001 Setup wizard: the steps to a working school, worked out from what is
// already there, so it can be left and picked up at any time.
import { useTranslation } from "react-i18next";
import { Button, Skeleton } from "../../../components/dashboard";
import { useLoad } from "./api";
import { BASE } from "./context";
import s from "./school.module.css";

const STEPS = {
  // Schools are self-serve now (approved straight away), hence the new wording and keys.
  profile: { title: "School profile ready", text: "Your school's name, type and contact details. Free, and ready straight away.", tk: "titleReady", xk: "textReady", to: "/admin-dashboard?section=org", action: "Open profile" },
  structure: { title: "Build the school tree", text: 'Grades and sections in one go: "Grades 1-8, sections A-C".', to: `${BASE}/tree`, action: "Build the tree" },
  people: { title: "Import students and teachers", text: "From a CSV or Excel file. Re-importing updates, never duplicates.", to: `${BASE}/people/import`, action: "Import" },
  assign: { title: "Give groups their teachers", text: "Each group needs at least one teacher.", to: "/admin-dashboard?section=batches", action: "Open groups" },
  parents: { title: "Invite parents", text: "One email each; signing in with that address links them.", to: `${BASE}/people/parents`, action: "Invite parents" },
  policies: { title: "Choose your policies", text: "Messaging, class averages, leaderboards, what the school sees.", to: `${BASE}/settings?tab=policies`, action: "Set policies" },
  dpa: { title: "Sign the data-processing agreement", text: "Required before students' data is processed for your school.", to: `${BASE}/settings?tab=privacy`, action: "Review and sign" },
};

export default function SetupPage() {
  const { t } = useTranslation();
  const data = useLoad("/setup");
  const d = data.data;
  const next = d?.steps.find((x) => !x.done);
  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h1 className={s.title}>{t("school.setup.title", { defaultValue: "Set up your school" })}</h1>
          <p className={s.sub}>{t("school.setup.sub", { defaultValue: "About an afternoon for a whole school. Stop any time: your progress is saved." })}</p>
        </div>
      </div>
      {!d ? <Skeleton variant="text" lines={8} /> : (
        <section className={s.card} aria-labelledby="setup-h">
          <h2 id="setup-h" className={s.cardTitle}>{t("school.setup.progressN", { defaultValue: "{{done}} of {{total}} done", done: d.done, total: d.total })}</h2>
          <div className={s.meter} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={d.percent} aria-label={t("school.setup.progress", { defaultValue: "Setup progress" })} style={{ margin: "10px 0 18px" }}>
            <div className={s.meterFill} style={{ width: `${d.percent}%` }} />
          </div>
          <ol className={s.checklist}>
            {d.steps.map((st, i) => {
              const info = STEPS[st.key];
              return (
                <li key={st.key} className={s.checkItem} aria-current={next?.key === st.key ? "step" : undefined}>
                  <span className={`${s.checkMark} ${st.done ? s.checkMarkDone : ""}`} aria-hidden="true">{st.done ? "✓" : i + 1}</span>
                  <span className={s.grow}>
                    <span className={s.strong}>{t(`school.setup.${st.key}.${info.tk || "title"}`, { defaultValue: info.title })}</span>
                    <span className="d-sr-only">{st.done ? t("school.setup.done", { defaultValue: " (done)" }) : t("school.setup.todo", { defaultValue: " (to do)" })}</span>
                    {st.optional && <span className={s.muted}> · {t("school.setup.optional", { defaultValue: "optional" })}</span>}
                    <br /><span className={`${s.small} ${s.muted}`}>{t(`school.setup.${st.key}.${info.xk || "text"}`, { defaultValue: info.text })}</span>
                  </span>
                  <Button size="sm" variant={next?.key === st.key ? "primary" : "ghost"} to={info.to}>{t(`school.setup.${st.key}.action`, { defaultValue: info.action })}</Button>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
