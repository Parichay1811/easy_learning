// Plans and billing (SUP-050/051): the plan catalogue (changes reach existing
// customers at renewal unless forced) and customer actions, each with a reason.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, DataTable } from "../../../components/dashboard";
import { useConsoleApi, useLoad, qs, money, dateOnly, dateTime } from "./api";
import { Facts, Field, Loadable, Modal, Notice, Pager, Panel, Pill, ReasonDialog, Segmented, StatusPill, TabBody, Tabs } from "./ui";
import s from "./console.module.css";

const toCents = (v) => Math.round(Number(String(v).replace(",", ".")) * 100) || 0;
const fromCents = (c) => (c == null ? "" : (c / 100).toFixed(2));

function PlanEditor({ plan, modules, onClose, onSaved }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const eur = plan.prices?.EUR || { month: 0, year: 0, perSeat: false };
  const [f, setF] = useState({ label: plan.label, modules: [...plan.modules], students: plan.limits?.students ?? "", groups: plan.limits?.groups ?? "", month: fromCents(eur.month), year: fromCents(eur.year), perSeat: !!eur.perSeat, trialDays: plan.trialDays ?? 0, active: plan.active !== false, forced: false });
  const [asking, setAsking] = useState(false);
  const toggle = (m) => setF({ ...f, modules: f.modules.includes(m) ? f.modules.filter((x) => x !== m) : [...f.modules, m] });
  const save = async (reason) => {
    const limits = {}; if (f.students !== "") limits.students = Number(f.students); if (f.groups !== "") limits.groups = Number(f.groups);
    await api.put(`/billing/plans/${plan.id}`, { label: f.label, modules: f.modules, limits, prices: { ...plan.prices, EUR: { month: toCents(f.month), year: toCents(f.year), perSeat: f.perSeat } }, trialDays: Number(f.trialDays), active: f.active, forced: f.forced, reason });
    onSaved(); onClose();
  };
  return (
    <Modal wide title={t("sa.bill.editPlan", "Edit plan: {{p}}", { p: plan.label })} onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>{t("sa.cancel", "Cancel")}</Button><Button onClick={() => setAsking(true)}>{t("sa.save", "Save changes")}</Button></>}>
      <div className={s.grid3}>
        <Field label={t("sa.bill.label", "Name")}><input className={s.input} value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></Field>
        <Field label={t("sa.bill.month", "Price per month (EUR)")}><input className={s.input} inputMode="decimal" value={f.month} onChange={(e) => setF({ ...f, month: e.target.value })} /></Field>
        <Field label={t("sa.bill.year", "Price per year (EUR)")}><input className={s.input} inputMode="decimal" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} /></Field>
        <Field label={t("sa.bill.students", "Learner limit (seats)")} hint={t("sa.bill.blank", "Blank = no limit")}><input className={s.input} type="number" min={0} value={f.students} onChange={(e) => setF({ ...f, students: e.target.value })} /></Field>
        <Field label={t("sa.bill.groups", "Group limit")} hint={t("sa.bill.blank", "Blank = no limit")}><input className={s.input} type="number" min={0} value={f.groups} onChange={(e) => setF({ ...f, groups: e.target.value })} /></Field>
        <Field label={t("sa.bill.trial", "Trial days")}><input className={s.input} type="number" min={0} max={90} value={f.trialDays} onChange={(e) => setF({ ...f, trialDays: e.target.value })} /></Field>
      </div>
      <div className={s.row}>
        <label className={s.check}><input type="checkbox" checked={f.perSeat} onChange={(e) => setF({ ...f, perSeat: e.target.checked })} /> {t("sa.bill.perSeat", "Price is per seat")}</label>
        <label className={s.check}><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> {t("sa.bill.active", "Open to new customers (off = grandfathered)")}</label>
      </div>
      <fieldset className={s.panel} style={{ boxShadow: "none", background: "var(--d-card-alt)", border: 0 }}>
        <legend className={s.label}>{t("sa.bill.modules", "Modules in this plan")}</legend>
        <div className={s.grid2}>{Object.entries(modules).map(([m, label]) => <label key={m} className={s.check}><input type="checkbox" checked={f.modules.includes(m)} onChange={() => toggle(m)} /> <span>{label} <span className={`${s.mono} ${s.muted}`}>{m}</span></span></label>)}</div>
      </fieldset>
      <label className={s.check}><input type="checkbox" checked={f.forced} onChange={(e) => setF({ ...f, forced: e.target.checked })} /> <span><span className={s.strong}>{t("sa.bill.force", "Apply to existing customers now")}</span><br /><span className={`${s.small} ${s.muted}`}>{t("sa.bill.forceHint", "Off: new customers get it now, existing customers at their next renewal.")}</span></span></label>
      {asking && <ReasonDialog title={t("sa.bill.whyPlan", "What changed and why?")} onClose={() => setAsking(false)} onConfirm={save} />}
    </Modal>
  );
}

function Plans({ role }) {
  const { t } = useTranslation();
  const p = useLoad("/billing/plans");
  const [editing, setEditing] = useState(null);
  const canEdit = ["owner", "finance"].includes(role);
  return (
    <Panel title={t("sa.bill.plans", "Plan catalogue")} sub={t("sa.bill.plansSub", "Prices are placeholders until set here. Changes are versioned.")}>
      <Loadable state={p}>
        {p.data && <DataTable caption={t("sa.bill.plans", "Plan catalogue")} rows={p.data.plans} getRowKey={(r) => r.id} onRowClick={canEdit ? setEditing : undefined} columns={[
          { key: "label", label: t("sa.col.plan", "Plan"), render: (r) => <span><span className={s.strong}>{r.label}</span> <span className={`${s.mono} ${s.muted}`}>{r.id} v{r.version}</span>{!r.active && <> <Pill>{t("sa.bill.closed", "closed")}</Pill></>}</span> },
          { key: "for", label: t("sa.bill.for", "For") },
          { key: "modules", label: t("sa.bill.modulesN", "Modules"), align: "end", render: (r) => r.modules.length },
          { key: "limits", label: t("sa.bill.limits", "Limits"), render: (r) => Object.entries(r.limits || {}).map(([k, v]) => `${k} ${v}`).join(", ") || "—" },
          { key: "price", label: t("sa.price", "Price"), render: (r) => { const e = r.prices?.EUR; return e ? `${money(e.month)} / ${t("sa.month", "month")}${e.perSeat ? ` ${t("sa.perSeat", "per seat")}` : ""}` : "—"; } },
          { key: "trialDays", label: t("sa.bill.trial", "Trial days"), align: "end" },
          { key: "subscribers", label: t("sa.bill.subscribers", "Customers"), align: "end", render: (r) => `${r.subscribers}${r.onOlderVersion ? ` (${r.onOlderVersion} ${t("sa.bill.older", "on older version")})` : ""}` },
        ]} />}
      </Loadable>
      {editing && <PlanEditor plan={editing} modules={p.data.modules} onClose={() => setEditing(null)} onSaved={() => p.reload()} />}
    </Panel>
  );
}

const ACTIONS = [
  ["seats", "Change seats", [["seats", "Seats", "number"]]],
  ["change-plan", "Change plan", [["plan", "Plan", "plan"], ["seats", "Seats", "number"], ["effective", "When", "when"]]],
  ["extend-trial", "Extend trial", [["days", "Days", "number"]]],
  ["end-trial", "End trial (start paying)", []],
  ["credit", "Apply a credit", [["amount", "Amount (EUR)", "money"]]],
  ["invoice", "Create invoice", [["amount", "Amount (EUR)", "money"], ["vat", "VAT (EUR)", "money"], ["country", "Country (2 letters)", "text"], ["reference", "PO / reference", "text"]]],
  ["pause", "Pause", []], ["resume", "Resume", []], ["renew", "Renew now", []],
  ["cancel", "Cancel", [["cancelReason", "Customer's reason", "text"], ["atPeriodEnd", "At the end of the period", "check"]]],
];

function SubscriptionModal({ id, plans, onClose, onChanged, canAct }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const list = useLoad(`/billing/subscriptions?limit=200`);
  const sub = list.data?.rows.find((r) => r.id === id);
  const [act, setAct] = useState(null);
  const [vals, setVals] = useState({});
  const [msg, setMsg] = useState("");
  const full = useLoad(sub?.org ? `/billing/orgs/${sub.org.saOrgId}` : null, { skip: !sub?.org });
  const S = full.data?.subscription || sub;
  const submit = async (reason) => {
    const body = { reason };
    for (const [k, , kind] of act[2]) {
      const v = vals[k];
      if (kind === "money") body[k === "amount" ? "amountCents" : "vatCents"] = toCents(v || 0);
      else if (kind === "number") body[k] = Number(v);
      else if (kind === "check") body[k] = !!v;
      else if (v !== undefined && v !== "") body[k] = v;
    }
    await api.post(`/billing/subscriptions/${id}/${act[0]}`, body);
    setMsg(t("sa.bill.done", "Done: {{a}}.", { a: act[1] })); full.reload({ quiet: true }); onChanged();
  };
  const markPaid = (inv) => setAct(["mark-paid", t("sa.bill.markPaid", "Mark invoice {{n}} paid", { n: inv.number }), [["method", "Method", "method"], ["reference", "PO / reference", "text"]], inv._id]);
  return (
    <Modal wide title={S ? `${S.org?.name || S.ownerId} · ${S.plan}` : t("sa.loading", "Loading…")} onClose={onClose}>
      {!S ? <p className={s.muted}>{t("sa.loading", "Loading…")}</p> : (
        <>
          <Notice tone="good" onClose={() => setMsg("")}>{msg}</Notice>
          <Facts items={[
            [t("sa.col.status", "Status"), <StatusPill key="s" status={S.status} />], [t("sa.col.seats", "Seats"), `${S.seats}${full.data ? ` (${full.data.seatsUsed} ${t("sa.bill.used", "used")})` : ""}`],
            [t("sa.price", "Price"), `${money(S.priceCents, S.currency)} / ${S.interval}`], [t("sa.bill.credit", "Credit"), money(S.creditCents || 0, S.currency)],
            [t("sa.periodEnd", "Renews"), dateOnly(S.periodEnd)], S.trialEndsAt && [t("sa.bill.trialEnds", "Trial ends"), dateOnly(S.trialEndsAt)],
            S.pendingChange && [t("sa.bill.pending", "At renewal"), `${S.pendingChange.plan} · ${S.pendingChange.seats} ${t("sa.bill.seats", "seats")}`],
            S.cancelAtPeriodEnd && [t("sa.bill.ending", "Ends"), t("sa.bill.atEnd", "at the end of this period")],
          ]} />
          {canAct && <div className={s.chipsRow}>{ACTIONS.map((a) => <button key={a[0]} type="button" className={s.chipBtn} onClick={() => { setVals({}); setAct([a[0], t(`sa.bill.a.${a[0]}`, a[1]), a[2]]); }}>{t(`sa.bill.a.${a[0]}`, a[1])}</button>)}</div>}
          {(S.invoices || []).length > 0 && (
            <DataTable caption={t("sa.bill.invoices", "Invoices")} rows={S.invoices} getRowKey={(i) => i._id || i.number} columns={[
              { key: "number", label: "#" }, { key: "amountCents", label: t("sa.amount", "Amount"), align: "end", render: (i) => money(i.amountCents, i.currency) },
              { key: "status", label: t("sa.col.status", "Status"), render: (i) => <StatusPill status={i.status} /> }, { key: "dueAt", label: t("sa.due", "Due"), render: (i) => dateOnly(i.dueAt) },
              { key: "method", label: t("sa.bill.method", "Method"), render: (i) => `${i.method || "—"}${i.reference ? ` · ${i.reference}` : ""}` },
              { key: "pay", label: "", render: (i) => (i.status === "open" && canAct ? <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setVals({}); markPaid(i); }}>{t("sa.bill.paid", "Mark paid")}</Button> : null) },
            ]} />
          )}
          {(S.history || []).length > 0 && (
            <details><summary className={s.label}>{t("sa.bill.history", "History")}</summary>
              <ul className={s.list}>{S.history.slice().reverse().slice(0, 40).map((h, i) => <li key={i} className={s.listItem}><span><span className={s.mono}>{h.action}</span> · {h.by}{h.meta?.reason ? ` · ${h.meta.reason}` : ""}</span><span className={`${s.small} ${s.muted}`}>{dateTime(h.at)}</span></li>)}</ul>
            </details>
          )}
        </>
      )}
      {act && (
        <ReasonDialog title={act[1]} onClose={() => setAct(null)} onConfirm={(reason) => (act[0] === "mark-paid" ? api.post(`/billing/subscriptions/${id}/mark-paid`, { reason, invoiceId: act[3], method: vals.method || "invoice", reference: vals.reference }).then(() => { setMsg(t("sa.bill.paidDone", "Marked paid.")); full.reload({ quiet: true }); onChanged(); }) : submit(reason))}
          extra={act[2].length > 0 && <div className={s.grid2}>{act[2].map(([k, label, kind]) => (
            <Field key={k} label={t(`sa.bill.f.${k}`, label)}>
              {kind === "plan" ? <select className={s.select} value={vals[k] || ""} onChange={(e) => setVals({ ...vals, [k]: e.target.value })}><option value="">—</option>{plans.filter((p) => p.for !== "family").map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
                : kind === "when" ? <select className={s.select} value={vals[k] || "now"} onChange={(e) => setVals({ ...vals, [k]: e.target.value })}><option value="now">{t("sa.bill.now", "Now")}</option><option value="renewal">{t("sa.bill.atRenewal", "At renewal")}</option></select>
                  : kind === "method" ? <select className={s.select} value={vals[k] || "invoice"} onChange={(e) => setVals({ ...vals, [k]: e.target.value })}>{["invoice", "po", "bank", "card"].map((m) => <option key={m}>{m}</option>)}</select>
                    : kind === "check" ? <input type="checkbox" checked={!!vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.checked })} />
                      : <input className={s.input} inputMode={kind === "text" ? undefined : "decimal"} value={vals[k] || ""} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} />}
            </Field>
          ))}</div>} />
      )}
    </Modal>
  );
}

function StartSubscription({ saOrgId, plans, onClose, onDone }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const [f, setF] = useState({ plan: "institute", seats: 30, interval: "month", trialDays: 0 });
  const [asking, setAsking] = useState(false);
  return (
    <Modal title={t("sa.bill.start", "Start a subscription")} onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>{t("sa.cancel", "Cancel")}</Button><Button onClick={() => setAsking(true)}>{t("sa.bill.startBtn", "Start")}</Button></>}>
      <Field label={t("sa.col.plan", "Plan")}><select className={s.select} value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })}>{plans.filter((p) => p.for !== "family").map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></Field>
      <Field label={t("sa.bill.seats", "Seats")}><input className={s.input} type="number" min={0} value={f.seats} onChange={(e) => setF({ ...f, seats: e.target.value })} /></Field>
      <Field label={t("sa.bill.interval", "Billed")}><select className={s.select} value={f.interval} onChange={(e) => setF({ ...f, interval: e.target.value })}><option value="month">{t("sa.monthly", "Monthly")}</option><option value="year">{t("sa.yearly", "Yearly")}</option></select></Field>
      <Field label={t("sa.bill.trial", "Trial days")}><input className={s.input} type="number" min={0} max={90} value={f.trialDays} onChange={(e) => setF({ ...f, trialDays: e.target.value })} /></Field>
      {asking && <ReasonDialog title={t("sa.bill.startWhy", "Why are we starting this subscription?")} onClose={() => setAsking(false)} onConfirm={async (reason) => { await api.post(`/billing/orgs/${saOrgId}`, { ...f, seats: Number(f.seats), trialDays: Number(f.trialDays), reason }); onDone(); onClose(); }} />}
    </Modal>
  );
}

function Subscriptions({ role, params, setParams }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const list = useLoad(`/billing/subscriptions${qs({ page, status, limit: 25 })}`);
  const plans = useLoad("/billing/plans");
  const open = params.get("sub");
  const start = params.get("start");
  const set = (patch) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(patch)) { if (v) n.set(k, v); else n.delete(k); } n.set("section", "billing"); return n; });
  const L = list.data;
  return (
    <Panel title={t("sa.bill.subs", "Subscriptions")} sub={t("sa.bill.subsSub", "Start one from an organisation's page. Card payments (Stripe) update these automatically when configured.")}>
      <Segmented label={t("sa.col.status", "Status")} value={status} onChange={(x) => { setPage(1); setStatus(x); }} options={["", "active", "trialing", "past_due", "paused", "cancelled"].map((x) => ({ key: x, label: x ? t(`sa.status.${x}`, x.replace("_", " ")) : t("sa.all", "All") }))} />
      <Loadable state={list} empty={L && !L.rows.length ? { title: t("sa.bill.noSubs", "No subscriptions yet.") } : null}>
        {L && (
          <>
            <DataTable caption={t("sa.bill.subs", "Subscriptions")} rows={L.rows} getRowKey={(r) => r.id} onRowClick={(r) => set({ sub: r.id })} columns={[
              { key: "org", label: t("sa.f.org", "Organisation"), render: (r) => r.org?.name || r.ownerId },
              { key: "plan", label: t("sa.col.plan", "Plan") }, { key: "status", label: t("sa.col.status", "Status"), render: (r) => <StatusPill status={r.status} /> },
              { key: "seats", label: t("sa.col.seats", "Seats"), align: "end" }, { key: "priceCents", label: t("sa.price", "Price"), align: "end", render: (r) => `${money(r.priceCents, r.currency)} / ${r.interval}` },
              { key: "periodEnd", label: t("sa.periodEnd", "Renews"), render: (r) => dateOnly(r.periodEnd) },
            ]} />
            <Pager page={L.page} limit={25} total={L.total} onPage={setPage} />
          </>
        )}
      </Loadable>
      {open && plans.data && <SubscriptionModal id={open} plans={plans.data.plans} canAct={["owner", "finance"].includes(role)} onClose={() => set({ sub: "" })} onChanged={() => list.reload({ quiet: true })} />}
      {start && plans.data && <StartSubscription saOrgId={start} plans={plans.data.plans} onClose={() => set({ start: "" })} onDone={() => list.reload()} />}
    </Panel>
  );
}

export default function Billing({ role, params, setParams }) {
  const { t } = useTranslation();
  const tab = params.get("tab") || "subs";
  return (
    <>
      <Tabs label={t("sa.nav.billing", "Plans & billing")} value={tab} onChange={(k) => setParams(new URLSearchParams({ section: "billing", tab: k }))} tabs={[{ key: "subs", label: t("sa.bill.subs", "Subscriptions") }, { key: "plans", label: t("sa.bill.plans", "Plan catalogue") }]} />
      <TabBody value={tab}>
        {tab === "plans" ? <Plans role={role} /> : <Subscriptions role={role} params={params} setParams={setParams} />}
      </TabBody>
    </>
  );
}
