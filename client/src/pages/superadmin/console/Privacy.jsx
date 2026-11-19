// Data-rights queue (SUP-061): export and delete requests with the GDPR 30-day
// due date, where the learner's data still is (all three databases), and a
// proof of completion before a deletion can be closed.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, DataTable } from "../../../components/dashboard";
import { useConsoleApi, useLoad, qs, dateOnly } from "./api";
import { Facts, Loadable, Modal, Notice, Pager, Panel, Pill, ReasonDialog, Segmented, StatusPill } from "./ui";
import s from "./console.module.css";

function Request({ id, onClose, onChanged }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const r = useLoad(`/data-requests/${id}`);
  const [dialog, setDialog] = useState(null);
  const [msg, setMsg] = useState({ tone: "good", text: "" });
  const R = r.data;
  const update = async (status, note = "") => {
    await api.patch(`/data-requests/${id}`, { status, note });
    setMsg({ tone: "good", text: t("sa.dr.updated", "Updated.") }); r.reload({ quiet: true }); onChanged();
  };
  const run = async (fn) => { try { await fn(); } catch (e) { setMsg({ tone: "alert", text: e.message }); } };
  return (
    <Modal wide title={R ? `${R.request.kind === "delete" ? t("sa.dr.delete", "Delete") : t("sa.dr.export", "Export")}: ${R.request.subjectName || R.request.subjectEmail}` : t("sa.loading", "Loading…")} onClose={onClose}>
      <Loadable state={r}>
        {R && (
          <>
            <Notice tone={msg.tone} onClose={() => setMsg({ text: "" })}>{msg.text}</Notice>
            <Facts items={[
              [t("sa.dr.subject", "Learner"), R.request.subjectEmail],
              [t("sa.dr.by", "Asked by"), `${R.request.requestedByRole} ${R.request.requestedById}`],
              [t("sa.col.status", "Status"), <StatusPill key="s" status={R.request.overdue ? "overdue" : R.request.status} label={R.request.overdue ? t("sa.dr.overdueN", "overdue by {{n}} d", { n: -R.request.daysLeft }) : undefined} />],
              [t("sa.due", "Due"), `${dateOnly(R.request.dueAt)} (${R.request.daysLeft} d)`],
              R.request.resolvedAt && [t("sa.dr.resolved", "Resolved"), `${dateOnly(R.request.resolvedAt)} · ${R.request.resolvedBy}`],
            ]} />
            <h3 className={s.label}>{t("sa.dr.where", "Where this learner's data is ({{n}} records)", { n: R.remaining })}</h3>
            <DataTable caption={t("sa.dr.where2", "Records per collection")} rows={R.footprint} getRowKey={(x) => `${x.db}.${x.collection}`} columns={[
              { key: "db", label: t("sa.dr.db", "Database") }, { key: "collection", label: t("sa.dr.collection", "Collection") },
              { key: "count", label: t("sa.dr.records", "Records"), align: "end", render: (x) => (x.count ? x.count : <Pill tone="good">0</Pill>) },
            ]} />
            {R.request.note && <pre className={`${s.secretValue} ${s.small}`}>{R.request.note}</pre>}
            <div className={s.row}>
              {R.request.status === "pending" && <Button size="sm" variant="soft" onClick={() => run(() => update("processing"))}>{t("sa.dr.start", "Start working on it")}</Button>}
              {R.request.kind === "export" && <Button size="sm" variant="soft" onClick={() => run(() => api.download(`/data-requests/${id}/export`, `learnigo-export-${R.request.subjectEmail}.json`))}>{t("sa.dr.download", "Download export (JSON)")}</Button>}
              {R.request.kind === "delete" && ["pending", "processing"].includes(R.request.status) && <Button size="sm" variant="ghost" onClick={() => run(async () => { await api.post(`/data-requests/${id}/run-deletion`); r.reload(); })}>{t("sa.dr.run", "Run deletion")}</Button>}
              {["pending", "processing"].includes(R.request.status) && <Button size="sm" onClick={() => setDialog("done")}>{t("sa.dr.done", "Mark done")}</Button>}
              {["pending", "processing"].includes(R.request.status) && <Button size="sm" variant="ghost" onClick={() => setDialog("reject")}>{t("sa.dr.reject", "Reject")}</Button>}
            </div>
            {R.service == null && R.request.kind === "delete" && <p className={`${s.small} ${s.muted}`}>{t("sa.dr.noService", "The automatic deletion service (Parent privacy centre) is not installed yet. A deletion can only be closed once every count above is 0.")}</p>}
          </>
        )}
      </Loadable>
      {dialog === "done" && <ReasonDialog title={t("sa.dr.doneTitle", "Close as done")} intro={R.request.kind === "delete" ? t("sa.dr.doneDelete", "We check every database again; it only closes when nothing is left. The proof is saved.") : t("sa.dr.doneExport", "Confirm the export was sent to the person.")} min={3} onClose={() => setDialog(null)} onConfirm={(note) => update("done", note)} />}
      {dialog === "reject" && <ReasonDialog danger title={t("sa.dr.rejectTitle", "Reject this request")} intro={t("sa.dr.rejectIntro", "The person is told the reason.")} onClose={() => setDialog(null)} onConfirm={(note) => update("rejected", note)} />}
    </Modal>
  );
}

export default function Privacy({ params, setParams }) {
  const { t } = useTranslation();
  const status = params.get("status") || "";
  const [page, setPage] = useState(1);
  const q = useLoad(`/data-requests${qs({ status, page, limit: 25 })}`);
  const open = params.get("request");
  const set = (patch) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(patch)) { if (v) n.set(k, v); else n.delete(k); } n.set("section", "privacy"); return n; });
  const Q = q.data;
  return (
    <Panel title={t("sa.dr.title", "Data-rights requests")} sub={t("sa.dr.sub", "GDPR: answer within 30 days. Overdue first.")} actions={
      <Segmented label={t("sa.dr.filter", "Show")} value={status} onChange={(k) => { setPage(1); set({ status: k }); }} options={[
        { key: "", label: t("sa.dr.openTab", "To do"), badge: (Q?.counts.pending || 0) + (Q?.counts.processing || 0) || undefined },
        { key: "done", label: t("sa.status.done", "Done") }, { key: "rejected", label: t("sa.status.rejected", "Rejected") }, { key: "all", label: t("sa.all", "All") },
      ]} />
    }>
      <Loadable state={q} empty={Q && !Q.rows.length ? { title: t("sa.dr.none", "No requests here."), text: t("sa.dr.noneText", "Requests from parents, schools and adults appear here.") } : null}>
        {Q && (
          <>
            <DataTable caption={t("sa.dr.title", "Data-rights requests")} rows={Q.rows} getRowKey={(r) => r.id} onRowClick={(r) => set({ request: r.id })} columns={[
              { key: "subjectEmail", label: t("sa.dr.subject", "Learner"), render: (r) => <span><span className={s.strong}>{r.subjectName || "—"}</span><br /><span className={`${s.small} ${s.muted}`}>{r.subjectEmail}</span></span> },
              { key: "kind", label: t("sa.dr.kind", "Request"), render: (r) => <Pill tone={r.kind === "delete" ? "alert" : "accent"}>{r.kind === "delete" ? t("sa.dr.delete", "Delete") : t("sa.dr.export", "Export")}</Pill> },
              { key: "requestedByRole", label: t("sa.dr.by", "Asked by") },
              { key: "status", label: t("sa.col.status", "Status"), render: (r) => <StatusPill status={r.overdue ? "overdue" : r.status} /> },
              { key: "dueAt", label: t("sa.due", "Due"), render: (r) => `${dateOnly(r.dueAt)}${["pending", "processing"].includes(r.status) ? ` (${r.daysLeft} d)` : ""}` },
            ]} />
            <Pager page={Q.page} limit={25} total={Q.total} onPage={setPage} />
          </>
        )}
      </Loadable>
      {open && <Request id={open} onClose={() => set({ request: "" })} onChanged={() => q.reload({ quiet: true })} />}
    </Panel>
  );
}
