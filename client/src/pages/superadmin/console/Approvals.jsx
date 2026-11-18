// Approval queue (SUP-014): new institutes with verification hints, an SLA
// timer and templated rejection reasons. Solo workspaces need no approval.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/dashboard";
import { useConsoleApi, useLoad, dateTime } from "./api";
import { Loadable, Notice, Panel, Pill, ReasonDialog, StatusPill, Tabs } from "./ui";
import s from "./console.module.css";

const HINT = { good: s.hintGood, attention: s.hintAttention, alert: s.hintAlert, info: s.hintInfo };

export default function Approvals({ go }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const [status, setStatus] = useState("pending");
  const q = useLoad(`/approvals?status=${status}`);
  const [rejecting, setRejecting] = useState(null);
  const [note, setNote] = useState("");
  const rows = q.data?.rows || [];

  const approve = async (o) => {
    try { await api.put(`/organizations/${o.id}/approve`); setNote(t("sa.appr.approved", "{{n}} approved.", { n: o.name })); q.reload(); } catch (e) { setNote(e.message); }
  };

  return (
    <Panel title={t("sa.appr.title", "Approvals")} sub={t("sa.appr.sub", "Target: decide within {{h}} hours of (re)submission. Hints are checks, not verdicts.", { h: q.data?.slaHours || 48 })}>
      <Tabs label={t("sa.appr.filter", "Show")} value={status} onChange={setStatus} tabs={[
        { key: "pending", label: t("sa.status.pending", "Pending") }, { key: "rejected", label: t("sa.status.rejected", "Rejected") }, { key: "approved", label: t("sa.status.approved", "Approved") },
      ]} />
      <Notice tone="good" onClose={() => setNote("")}>{note}</Notice>
      <Loadable state={q} empty={q.data && !rows.length ? { title: t("sa.appr.none", "Nothing waiting."), text: t("sa.appr.noneText", "New registrations appear here.") } : null}>
        <ul className={s.list}>
          {rows.map((o) => (
            <li key={o.id} className={s.panel} style={{ boxShadow: "none", background: "var(--d-card-alt)" }}>
              <div className={s.row}>
                <h3 style={{ margin: 0 }}>{o.name}</h3>
                <StatusPill status={o.status} />
                {o.sla.state !== "done" && <Pill tone={o.sla.state === "overdue" ? "alert" : o.sla.state === "due_soon" ? "attention" : "good"}>
                  {o.sla.state === "overdue" ? t("sa.appr.overdue", "Overdue: waiting {{h}} h", { h: o.sla.hoursWaiting }) : t("sa.appr.waiting", "Waiting {{h}} h", { h: o.sla.hoursWaiting })}
                </Pill>}
                <span className={s.spacer} />
                <button type="button" className={s.linkBtn} onClick={() => go("orgs", { org: o.id })}>{t("sa.open", "Open")}</button>
              </div>
              <p className={`${s.small} ${s.muted}`}>{o.adminName || ""} · {o.adminEmail} · {o.phone || t("sa.appr.noPhone", "no phone")} · {o.address || t("sa.appr.noAddress", "no address")} · {t("sa.appr.registered", "registered {{d}}", { d: dateTime(o.createdAt) })}</p>
              <ul className={s.stack} style={{ listStyle: "none", padding: 0, margin: "8px 0" }}>
                {o.hints.map((h) => <li key={h.key} className={`${HINT[h.level]} ${s.small}`}>{h.text}</li>)}
              </ul>
              <div className={s.row}>
                {o.status !== "approved" && <Button size="sm" onClick={() => approve(o)}>{t("sa.approve", "Approve")}</Button>}
                {o.status !== "rejected" && <Button size="sm" variant="ghost" onClick={() => setRejecting(o)}>{t("sa.reject", "Reject")}</Button>}
              </div>
            </li>
          ))}
        </ul>
      </Loadable>
      {rejecting && (
        <ReasonDialog
          danger
          title={t("sa.appr.rejectTitle", "Reject {{n}}", { n: rejecting.name })}
          intro={t("sa.appr.rejectIntro", "The admin sees this reason and can fix and resubmit. Pick a template or write your own.")}
          templates={q.data?.templates || []}
          confirmLabel={t("sa.reject", "Reject")}
          onClose={() => setRejecting(null)}
          onConfirm={async (reason) => { await api.put(`/organizations/${rejecting.id}/reject`, { reason }); setNote(t("sa.appr.rejected", "Rejected with a reason.")); q.reload(); }}
        />
      )}
    </Panel>
  );
}
