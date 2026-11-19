// One organisation (SUP-011): profile and approval history, its tree, people,
// usage (the shared analytics), billing, support, audit and feature overrides.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ChartCard, KpiTile, TrendLine, toTable, usePane } from "../../../components/dashboard";
import { useConsoleApi, useLoad, dateOnly, dateTime, money } from "./api";
import { Facts, Loadable, Notice, Panel, Pill, ReasonDialog, StatusPill, TabBody, Tabs } from "./ui";
import { FlagPills, HealthBar } from "./orgBits";
import ViewAsDialog from "./ViewAsDialog";
import s from "./console.module.css";

const iso = (d) => d.toISOString().slice(0, 10);

export default function OrgDetail({ id, role, onBack, go }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const d = useLoad(`/organizations/${id}/detail`);
  const [range] = useState(() => ({ from: iso(new Date(Date.now() - 29 * 86400_000)), to: iso(new Date()) }));
  const usage = useLoad(`/organizations/${id}/analytics/overview?from=${range.from}&to=${range.to}`);
  const [dialog, setDialog] = useState(null);
  const [note, setNote] = useState({ tone: "good", text: "" });
  const [overrides, setOverrides] = useState(null);
  const support = role === "owner" || role === "support";
  const [pane, setPane] = usePane(["profile", "usage", "setup", "support", "features"]);

  const D = d.data;
  const ov = overrides ?? D?.entitlements.overrides ?? [];
  const stateOf = (m) => (ov.includes(m) ? "on" : ov.includes(`-${m}`) ? "off" : "");
  const setState = (m, v) => setOverrides([...ov.filter((x) => x !== m && x !== `-${m}`), ...(v === "on" ? [m] : v === "off" ? [`-${m}`] : [])]);
  const done = (text) => { setNote({ tone: "good", text }); d.reload(); };
  const pts = usage.data?.series?.points || [];

  return (
    <>
      {!D && <div className={s.row}><Button variant="ghost" size="sm" onClick={onBack} data-sound="back">← {t("sa.orgs.back", "All organisations")}</Button></div>}
      <Loadable state={d}>
        {D && (
          <>
            <div className={s.orgHead}>
              <Button variant="ghost" size="sm" onClick={onBack} data-sound="back">← {t("sa.orgs.back", "All organisations")}</Button>
              <div className={s.orgTitle}>
                <h2 className={s.panelTitle}>{D.org.name}</h2>
                <span className={s.row}><StatusPill status={D.org.suspendedAt ? "suspended" : D.org.status} /><Pill tone="accent">{D.org.kind === "solo" ? t("sa.solo", "Solo") : t("sa.institute", "Institute")}</Pill>{D.row && <FlagPills flags={D.row.flags} />}</span>
              </div>
              {support && (
                <div className={s.panelActions}>
                  {D.admins[0] && <Button size="sm" variant="soft" onClick={() => setDialog({ kind: "viewas", target: { role: "admin", id: D.admins[0].id, name: D.admins[0].name, email: D.admins[0].email } })}>{t("sa.viewAsAdmin", "View as admin")}</Button>}
                  {D.org.suspendedAt
                    ? <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "unsuspend" })}>{t("sa.unsuspend", "Lift suspension")}</Button>
                    : <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "suspend" })}>{t("sa.suspend", "Suspend")}</Button>}
                </div>
              )}
            </div>
            <Notice tone={note.tone} onClose={() => setNote({ text: "" })}>{note.text}</Notice>
            <Tabs label={D.org.name} value={pane} onChange={setPane} tabs={[
              { key: "profile", label: t("sa.org.profile", "Profile") },
              { key: "usage", label: t("sa.org.usage", "Usage") },
              { key: "setup", label: t("sa.org.setup", "Structure and billing") },
              { key: "support", label: t("sa.org.supportAudit", "Support and audit") },
              { key: "features", label: t("sa.org.features", "Features") },
            ]} />
            <TabBody value={pane}>
            {pane === "profile" && <>
            <Panel title={t("sa.org.profile", "Profile")}>
              <Facts items={[
                [t("sa.f.admin", "Admin"), `${D.org.adminName || D.admins[0]?.name || "—"} · ${D.org.adminEmail}`],
                [t("sa.f.phone", "Phone"), D.org.phone || "—"],
                [t("sa.f.address", "Address"), D.org.address || "—"],
                [t("sa.f.country", "Country"), D.org.country || "—"],
                [t("sa.f.created", "Registered"), dateOnly(D.org.createdAt)],
                [t("sa.f.approved", "Approved"), D.org.approvedAt ? `${dateOnly(D.org.approvedAt)} · ${D.org.approvedBy || ""}` : "—"],
                [t("sa.f.health", "Health score"), <HealthBar key="h" value={D.row?.health} />],
                [t("sa.f.lastAdmin", "Admin last seen"), D.row?.lastAdminLogin || "—"],
                D.org.suspendedAt && [t("sa.f.suspended", "Suspended"), `${dateTime(D.org.suspendedAt)}: ${D.org.suspendReason}`],
              ]} />
              {D.org.rejectionHistory?.length > 0 && (
                <>
                  <h3 className={s.label}>{t("sa.orgs.history", "Approval history")}</h3>
                  <ul className={s.list}>{D.org.rejectionHistory.map((h, i) => <li key={i} className={s.listItem}><span>{h.reason}</span><span className={s.muted}>{dateTime(h.rejectedAt)}</span></li>)}</ul>
                </>
              )}
            </Panel>
            <div className={s.kpis}>
              <KpiTile label={t("sa.people.students", "Learners")} value={D.people.students} helpText={D.row?.seatLimit ? t("sa.orgs.seatsOf", "of {{n}} seats", { n: D.row.seatLimit }) : undefined} tone={D.row?.flags.includes("over_limit") ? "alert" : "neutral"} />
              <KpiTile label={t("sa.people.active7", "Active in 7 days")} value={D.row?.active7 ?? null} />
              <KpiTile label={t("sa.people.teachers", "Teachers")} value={D.people.teachers} helpText={t("sa.orgs.activeTeachers", "{{n}} active in 14 days", { n: D.row?.activeTutors ?? 0 })} />
              <KpiTile label={t("sa.people.parents", "Parents")} value={D.people.parents} helpText={t("sa.orgs.linked", "{{n}} learners with a linked parent", { n: D.row?.linkedParents ?? 0 })} />
            </div>
            </>}

            {pane === "usage" && <ChartCard
              title={t("sa.orgs.usageQ", "How much are they learning?")}
              answer={usage.data ? usage.data.story : ""}
              info={t("sa.orgs.usageInfo", "Minutes of learning per day across this organisation's learners, last 30 days (shared analytics).")}
              loading={usage.loading} error={usage.error} onRetry={usage.reload}
              table={pts.length ? toTable.trend(pts.map((p) => ({ x: p.key, value: p.minutes })), t) : undefined}
            >
              <TrendLine data={pts.map((p) => ({ x: p.key, value: p.minutes }))} unit="min" seriesLabel={t("sa.minutes", "Minutes")} />
            </ChartCard>}

            {pane === "setup" && <div className={s.grid2}>
              <Panel title={t("sa.orgs.tree", "Structure")} sub={t("sa.orgs.treeSub", "Read-only. Groups (and units, when the school uses them).")}>
                {D.tree.units.length > 0 && <ul className={s.list}>{D.tree.units.map((u) => <li key={u.id} className={s.listItem}><span>{u.path || u.name}</span><Pill>{u.type}</Pill></li>)}</ul>}
                {D.tree.batches.length ? (
                  <table className={`${s.table} ${s.cards}`}>
                    <thead><tr><th>{t("sa.col.group", "Group")}</th><th className={s.num}>{t("sa.col.learners", "Learners")}</th><th className={s.num}>{t("sa.col.teachers", "Teachers")}</th></tr></thead>
                    <tbody>{D.tree.batches.map((b) => <tr key={b.id}><td data-label={t("sa.col.group", "Group")}>{b.name}</td><td data-label={t("sa.col.learners", "Learners")} className={s.num}>{b.students}</td><td data-label={t("sa.col.teachers", "Teachers")} className={s.num}>{b.teachers}</td></tr>)}</tbody>
                  </table>
                ) : <p className={s.muted}>{t("sa.orgs.noGroups", "No groups yet.")}</p>}
              </Panel>
              <Panel title={t("sa.orgs.billing", "Billing")}>
                {D.billing ? (
                  <Facts items={[
                    [t("sa.col.plan", "Plan"), `${D.billing.plan} (v${D.billing.planVersion || 0})`],
                    [t("sa.col.status", "Status"), <StatusPill key="s" status={D.billing.status} />],
                    [t("sa.col.seats", "Seats"), D.billing.seats || "—"],
                    [t("sa.price", "Price"), `${money(D.billing.priceCents, D.billing.currency)} / ${D.billing.interval}`],
                    [t("sa.periodEnd", "Renews"), dateOnly(D.billing.periodEnd)],
                    [t("sa.openInvoices", "Open invoices"), (D.billing.invoices || []).filter((i) => i.status === "open").length],
                  ]} />
                ) : (
                  <>
                    <p className={s.muted}>{t("sa.orgs.noSub", "No subscription record: plan comes from the legacy setting ({{p}}).", { p: D.row?.plan })}</p>
                    {["owner", "finance"].includes(role) && <Button size="sm" variant="soft" onClick={() => go("billing", { start: id })}>{t("sa.bill.start", "Start a subscription")}</Button>}
                  </>
                )}
              </Panel>
            </div>}

            {pane === "support" && <div className={s.grid2}>
              <Panel title={t("sa.orgs.support", "Support")} sub={t("sa.orgs.chatCount", "Chat messages with this admin: {{n}}", { n: D.support.chatMessages })}>
                {D.support.contacts.length ? <ul className={s.list}>{D.support.contacts.map((c) => <li key={c._id} className={s.listItem}><span>{c.subject}</span><StatusPill status={c.status === "in_progress" ? "pending" : c.status} /></li>)}</ul> : <p className={s.muted}>{t("sa.orgs.noContacts", "No contact messages.")}</p>}
              </Panel>
              <Panel title={t("sa.orgs.audit", "Recent audit")}>
                {D.audit.length ? (
                  <ul className={s.list}>{D.audit.slice(0, 10).map((e) => <li key={e.id} className={s.listItem}><span><span className={s.mono}>{e.action}</span><br /><span className={`${s.small} ${s.muted}`}>{e.actorEmail || e.actorRole}{e.reason ? ` · ${e.reason}` : ""}</span></span><span className={`${s.small} ${s.muted}`}>{dateTime(e.at)}</span></li>)}</ul>
                ) : <p className={s.muted}>{t("sa.orgs.noAudit", "Nothing recorded yet.")}</p>}
              </Panel>
            </div>}

            {pane === "features" && <Panel
              title={t("sa.orgs.features", "Features for this organisation")}
              sub={t("sa.orgs.featuresSub", "Plan: {{p}}. Override single modules here; a platform kill switch still wins.", { p: D.entitlements.plan })}
              actions={["owner", "support", "engineer"].includes(role) && overrides && <Button size="sm" onClick={() => setDialog({ kind: "overrides" })}>{t("sa.save", "Save changes")}</Button>}
            >
              <table className={`${s.table} ${s.cards}`}>
                <thead><tr><th>{t("sa.col.module", "Module")}</th><th>{t("sa.col.now", "Now")}</th><th>{t("sa.col.why", "Why")}</th><th>{t("sa.col.override", "Override")}</th></tr></thead>
                <tbody>
                  {Object.entries(D.entitlements.allModules).map(([m, label]) => (
                    <tr key={m}>
                      <td data-label={t("sa.col.module", "Module")}><span className={s.strong}>{label}</span><br /><span className={`${s.mono} ${s.muted}`}>{m}</span></td>
                      <td data-label={t("sa.col.now", "Now")}>{D.entitlements.modules.includes(m) ? <Pill tone="good">{t("sa.on", "On")}</Pill> : <Pill>{t("sa.off", "Off")}</Pill>}</td>
                      <td data-label={t("sa.col.why", "Why")} className={`${s.small} ${s.muted}`}>{D.entitlements.why[m] || "—"}</td>
                      <td data-label={t("sa.col.override", "Override")}>
                        <select className={s.select} aria-label={t("sa.overrideFor", "Override for {{m}}", { m: label })} value={stateOf(m)} onChange={(e) => setState(m, e.target.value)} disabled={!["owner", "support", "engineer"].includes(role)}>
                          <option value="">{t("sa.ov.plan", "As the plan says")}</option><option value="on">{t("sa.ov.on", "Always on")}</option><option value="off">{t("sa.ov.off", "Always off")}</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>}
            </TabBody>
          </>
        )}
      </Loadable>
      {dialog?.kind === "viewas" && <ViewAsDialog target={dialog.target} onClose={() => setDialog(null)} />}
      {dialog?.kind === "suspend" && <ReasonDialog danger title={t("sa.suspendTitle", "Suspend {{n}}", { n: D.org.name })} intro={t("sa.suspendIntro", "Its admins and teachers are stopped at once; students keep learning. The admin gets an email with the reason.")} onClose={() => setDialog(null)} onConfirm={async (reason) => { await api.post(`/organizations/${id}/suspend`, { reason }); done(t("sa.suspended", "Suspended.")); }} />}
      {dialog?.kind === "unsuspend" && <ReasonDialog title={t("sa.unsuspendTitle", "Lift the suspension")} intro={t("sa.unsuspendIntro", "Add the appeal outcome.")} min={3} onClose={() => setDialog(null)} onConfirm={async (note2) => { await api.post(`/organizations/${id}/unsuspend`, { note: note2 }); done(t("sa.unsuspended", "Suspension lifted.")); }} />}
      {dialog?.kind === "overrides" && <ReasonDialog title={t("sa.ovTitle", "Change features for {{n}}", { n: D.org.name })} intro={ov.join(", ") || t("sa.ovNone", "No overrides: exactly the plan.")} onClose={() => setDialog(null)} onConfirm={async (reason) => { await api.put(`/organizations/${id}/overrides`, { featureOverrides: ov, reason }); setOverrides(null); done(t("sa.ovSaved", "Features updated.")); }} />}
    </>
  );
}
