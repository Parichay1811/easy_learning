import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../../components/dashboard";
import LearningPlanEditor from "../../components/learning/LearningPlanEditor";
import { useLoad } from "./parentApi";
import s from "./parent.module.css";

// The child's learning plan (levels, pace, goals, comfort settings, skills to
// focus on or skip, tricky spots, weeks): GET/PUT /api/parent/children/:id/learning.
// Only for verified children (the dashboard shows nothing else).
export default function ParentPlan({ api, child }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.plan.${k}`, { defaultValue: d, ...o });
  const path = `/children/${child._id}/learning`;
  const q = useLoad(api.get, path);
  const first = child.name.split(" ")[0];

  const { reload } = q;
  const save = useCallback(async (patch) => {
    const r = await api.put(path, patch);
    if (r.success) reload();
    return { ok: r.success, message: r.status === 403 ? t("parent.plan.forbidden", { defaultValue: "Only a verified parent or carer can change this plan. Confirm the link to your child first." }) : r.message };
  }, [api, path, reload, t]);

  if (q.code === "LINK_NOT_VERIFIED" && !q.data) {
    return (
      <div className={s.card}>
        <EmptyState icon="🔗" title={T("unverifiedTitle", "Confirm the link first")}
          text={T("unverifiedText", "Once the link to {{name}} is confirmed with a code or by the school, you can see and change the learning plan here.", { name: first })} />
      </div>
    );
  }
  if (q.status === 404 && !q.data) {
    return (
      <div className={s.card}>
        <EmptyState icon="🌱" title={T("soonTitle", "Learning plans are on their way")}
          text={T("soonText", "Soon you can set {{name}}'s level, pace and goals here.", { name: first })} />
      </div>
    );
  }
  return (
    <section className={s.card} aria-labelledby="p-plan-h">
      <div className={s.cardHead}><h2 id="p-plan-h">{T("title", "{{name}}'s learning plan", { name: first })}</h2></div>
      <p className={`${s.muted} ${s.small}`} style={{ marginTop: 0 }}>
        {T("sub", "Set a level and pace that feel right, and add goals and comfort settings. If {{name}} has a teacher on Learnigo, they see the same plan.", { name: first })}
      </p>
      <LearningPlanEditor key={child._id} data={q.data} loading={q.loading} error={q.error} onRetry={q.reload} onSave={save} role="parent" name={first} idBase="pplan" />
    </section>
  );
}
