// Organisations (SUP-010/011): one table for institutes and solo workspaces,
// filters in the URL, saved views, export; a row opens the organisation.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, DataTable } from "../../../components/dashboard";
import { qs, useConsoleApi, useLoad } from "./api";
import { Field, Loadable, Notice, Pager, Panel, StatusPill } from "./ui";
import OrgDetail from "./OrgDetail";
import { FlagPills, HealthBar } from "./orgBits";
import { FLAG_LABEL } from "./labels";
import s from "./console.module.css";

const KEYS = ["q", "kind", "status", "plan", "flag", "sort", "page"];

export default function Orgs({ role, params, setParams, me, go }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const org = params.get("org");
  const f = Object.fromEntries(KEYS.map((k) => [k, params.get(k) || ""]));
  const [q, setQ] = useState(f.q);
  const [note, setNote] = useState("");
  const [views, setViews] = useState([]);
  const dir = useLoad(org ? null : `/directory${qs({ ...f, limit: 25 })}`, { skip: !!org });
  useEffect(() => {
    // Saved views live with the staff account.
    api.get("/auth/me").then((d) => setViews((d.staff?.prefs?.savedViews || []).filter((v) => v.section === "orgs"))).catch(() => {});
  }, [api]);

  const set = (patch) => setParams((p) => {
    const n = new URLSearchParams(p);
    for (const [k, v] of Object.entries(patch)) { if (v) n.set(k, v); else n.delete(k); }
    if (!("page" in patch)) n.delete("page");
    n.set("section", "orgs");
    return n;
  });

  if (org) return <OrgDetail id={org} role={role} go={go} onBack={() => set({ org: "" })} />;

  const D = dir.data;
  const saveView = async () => {
    const name = window.prompt(t("sa.orgs.viewName", "Name this view"));
    if (!name) return;
    const all = [...views.filter((v) => v.name !== name), { name, section: "orgs", query: Object.fromEntries(Object.entries(f).filter(([k, v]) => v && k !== "page")) }];
    try {
      await api.put("/me/prefs", { savedViews: all });
      setViews(all); setNote(t("sa.orgs.viewSaved", "View saved."));
    } catch (e) { setNote(e.message); }
  };
  const exportCsv = () => api.download(`/directory${qs({ ...f, format: "csv" })}`, `learnigo-organisations.csv`).catch((e) => setNote(e.message));

  return (
    <Panel
      title={t("sa.orgs.title", "Organisations")}
      sub={D ? t("sa.orgs.sub", "{{i}} institutes and {{s}} solo workspaces. Health combines engagement, teacher activity, linked parents and open support.", { i: D.facets.kinds.institute, s: D.facets.kinds.solo }) : ""}
      actions={<>
        {me?.staffId && <Button variant="ghost" size="sm" onClick={saveView}>{t("sa.orgs.saveView", "Save view")}</Button>}
        <Button variant="soft" size="sm" onClick={exportCsv}>{t("sa.export", "Export CSV")}</Button>
      </>}
    >
      <Notice tone="good" onClose={() => setNote("")}>{note}</Notice>
      {views.length > 0 && (
        <div className={s.chipsRow} role="group" aria-label={t("sa.orgs.views", "Saved views")}>
          {views.map((v) => <button key={v.name} type="button" className={s.chipBtn} onClick={() => setParams(new URLSearchParams({ section: "orgs", ...v.query }))}>{v.name}</button>)}
        </div>
      )}
      <form className={s.toolbar} onSubmit={(e) => { e.preventDefault(); set({ q }); }} role="search">
        <Field label={t("sa.search", "Search")}><input className={`${s.input} ${s.search}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("sa.orgs.searchPh", "Name, admin email or id")} /></Field>
        <Field label={t("sa.orgs.kind", "Kind")}>
          <select className={s.select} value={f.kind} onChange={(e) => set({ kind: e.target.value })}>
            <option value="">{t("sa.all", "All")}</option><option value="institute">{t("sa.institute", "Institute")}</option><option value="solo">{t("sa.solo", "Solo")}</option>
          </select>
        </Field>
        <Field label={t("sa.orgs.status", "Status")}>
          <select className={s.select} value={f.status} onChange={(e) => set({ status: e.target.value })}>
            <option value="">{t("sa.all", "All")}</option>
            {["approved", "pending", "rejected", "suspended"].map((x) => <option key={x} value={x}>{t(`sa.status.${x}`, x)}</option>)}
          </select>
        </Field>
        <Field label={t("sa.orgs.flag", "Flag")}>
          <select className={s.select} value={f.flag} onChange={(e) => set({ flag: e.target.value })}>
            <option value="">{t("sa.any", "Any")}</option>
            {Object.entries(FLAG_LABEL).map(([k, [label]]) => <option key={k} value={k}>{t(`sa.flag.${k}`, label)}{D ? ` (${D.facets.flags[k] || 0})` : ""}</option>)}
          </select>
        </Field>
        <Field label={t("sa.orgs.sort", "Sort")}>
          <select className={s.select} value={f.sort || "created"} onChange={(e) => set({ sort: e.target.value })}>
            <option value="created">{t("sa.sort.created", "Newest")}</option><option value="health">{t("sa.sort.health", "Health (lowest first)")}</option>
            <option value="learners">{t("sa.sort.learners", "Most learners")}</option><option value="active">{t("sa.sort.active", "Most active")}</option><option value="name">{t("sa.sort.name", "Name")}</option>
          </select>
        </Field>
        <Button type="submit" size="sm">{t("sa.apply", "Search")}</Button>
      </form>
      <Loadable state={dir} empty={D && !D.rows.length ? { title: t("sa.orgs.none", "No organisations match."), text: t("sa.orgs.noneText", "Clear a filter to see more."), actionLabel: t("sa.clear", "Clear filters"), onAction: () => setParams(new URLSearchParams({ section: "orgs" })) } : null}>
        {D && (
          <>
            <DataTable
              caption={t("sa.orgs.caption", "Organisations")}
              getRowKey={(r) => r.id}
              onRowClick={(r) => set({ org: r.id })}
              rows={D.rows}
              columns={[
                { key: "name", label: t("sa.col.name", "Name"), render: (r) => <span><span className={s.strong}>{r.name}</span><br /><span className={`${s.small} ${s.muted}`}>{r.adminEmail}</span></span> },
                { key: "kind", label: t("sa.col.kind", "Kind"), render: (r) => <span>{r.kind === "solo" ? t("sa.solo", "Solo") : t("sa.institute", "Institute")}<br /><span className={`${s.small} ${s.muted}`}>{r.country || "—"}</span></span> },
                { key: "status", label: t("sa.col.status", "Status"), render: (r) => <StatusPill status={r.suspendedAt ? "suspended" : r.status} /> },
                { key: "plan", label: t("sa.col.plan", "Plan"), render: (r) => <span>{r.plan}<br /><span className={`${s.small} ${s.muted}`}>{r.subscriptionStatus}</span></span> },
                { key: "seats", label: t("sa.col.seats", "Seats"), align: "end", render: (r) => <span className={s.nowrap}>{r.seatsUsed}{r.seatLimit ? ` / ${r.seatLimit}` : ""}</span> },
                { key: "active7", label: t("sa.col.active7", "Active 7 d"), align: "end" },
                { key: "health", label: t("sa.col.health", "Health"), render: (r) => <HealthBar value={r.health} /> },
                { key: "flags", label: t("sa.col.flags", "Flags"), render: (r) => <FlagPills flags={r.flags} /> },
                { key: "lastAdminLogin", label: t("sa.col.lastAdmin", "Admin seen"), render: (r) => <span className={s.nowrap}>{r.lastAdminLogin || "—"}</span> },
              ]}
            />
            <Pager page={D.page} limit={D.limit} total={D.total} onPage={(p) => set({ page: String(p) })} />
          </>
        )}
      </Loadable>
    </Panel>
  );
}
