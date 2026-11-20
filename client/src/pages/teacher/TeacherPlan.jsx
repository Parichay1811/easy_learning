// The student's learning plan through the teacher's eyes: the same editor the
// parent has (levels, lock, pace, goals, comfort settings, focus / skip, tricky
// spots, weeks). GET/PUT /api/teacher/students/:student/learning (the student's
// id or email; the id keeps the email out of URLs and logs).
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../../components/dashboard";
import LearningPlanEditor from "../../components/learning/LearningPlanEditor";
import { useLoad, useTeacherApi } from "./teacherApi";
import s from "./teacher.module.css";

export default function TeacherPlan({ student, name }) {
  const { t } = useTranslation();
  const { get, send } = useTeacherApi();
  const path = `/students/${encodeURIComponent(student)}/learning`;
  const q = useLoad(() => get(path), [path]);
  const { reload } = q;

  const save = useCallback(async (patch) => {
    const r = await send("PUT", path, patch);
    if (r.ok) reload();
    return { ok: r.ok, message: r.status === 403 ? t("teacher.plan.forbidden", { defaultValue: "Only this student's teachers can change the plan." }) : r.message };
  }, [send, path, reload, t]);

  if (q.status === 404 && !q.data && !q.loading) {
    return (
      <EmptyState icon="🌱" title={t("teacher.plan.soonTitle", { defaultValue: "Learning plans are on their way" })}
        text={t("teacher.plan.soonText", { defaultValue: "Soon you can set {{name}}'s level, pace and goals here.", name })} />
    );
  }
  return (
    <section className={s.card} aria-labelledby="t-plan-h">
      <h2 id="t-plan-h" className={s.h2}>{t("teacher.plan.title", { defaultValue: "{{name}}'s learning plan", name })}</h2>
      <p className={s.muted} style={{ marginTop: 0 }}>
        {t("teacher.plan.sub", { defaultValue: "Levels, pace, goals and comfort settings for {{name}}. Parents see the same plan, and {{name}} sees who chose a level.", name })}
      </p>
      <LearningPlanEditor key={student} data={q.data} loading={q.loading} error={q.error} onRetry={reload} onSave={save} role="teacher" name={name} idBase="tplan" />
    </section>
  );
}
