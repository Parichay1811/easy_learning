// Organisations (SUP-010/011): one table for institutes and solo workspaces,
// filters in the URL, saved views, export; a row opens the organisation.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, DataTable } from "../../../components/dashboard";
import { qs, useConsoleApi, useLoad } from "./api";
import { Field, Loadable, Modal, Notice, Pager, Panel, StatusPill } from "./ui";
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
  const [naming, setNaming] = useState(null);
  const [more, setMore] = useState(false);
  const filtersOn = ["kind", "status", "flag", "sort"].filter((k) => f[k]).length;
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

  if (org) return <OrgDetail id={org} role={role} go={go} onBack={() => set({ org: "", pane: "" })} />;

  const D = dir.data;
  const saveView = async (name) => {
    if (!name) return;
    const all = [...views.filter((v) => v.name !== name), { name, section: "orgs", query: Object.fromEntries(Object.entries(f).filter(([k, v]) => v && k !== "page")) }];
    try {
      await api.put("/me/prefs", { savedViews: all });
      setViews(all); setNote(t("sa.orgs.viewSaved", "View saved.")); setNaming(null);
    } catch (e) { setNote(e.message); }
  };
  const exportCsv = () => api.download(`/directory${qs({ ...f, format: "csv" })}`, `learnigo-organisations.csv`).catch((e) => setNote(e.message));

  return (
    <Panel
      title={t("sa.orgs.title", "Organisations")}
      sub={D ? t("sa.orgs.sub", "{{i}} institutes and {{s}} solo workspaces. Health combines engagement, teacher activity, linked parents and open support.", { i: D.facets.kinds.institute, s: D.facets.kinds.solo }) : ""}
      actions={<>
        {me?.staffId && <Button variant="ghost" size="sm" onClick={() => setNaming("")}>{t("sa.orgs.saveView", "Save view")}</Button>}
        <Button variant="soft" size="sm" onClick={exportCsv}>{t("sa.export", "Export CSV")}</Button>
      </>}
    >
      <Notice tone="good" onClose={() => setNote("")}>{note}</Notice>
      {views.length > 0 && (
        <div className={s.chipsRow} role="group" aria-label={t("sa.orgs.views", "Saved views")}>
          {views.map((v) => <button key={v.name} type="button" className={s.chipBtn} onClick={() => setParams(new URLSearchParams({ section: "orgs", ...v.query }))}>{v.name}</button>)}
        </div>
      )}
      <form className={`${s.toolbar} ${s.filters}`} onSubmit={(e) => { e.preventDefault(); set({ q }); }} role="search">
        <Field label={t("sa.search", "Search")}><input className={`${s.input} ${s.search}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("sa.orgs.searchPh", "Name, admin email or id")} /></Field>
        <button type="button" className={`${s.chipBtn} ${s.filterToggle}`} aria-expanded={more} aria-controls="sa-org-filters" onClick={() => setMore((v) => !v)}>
          {t("sa.filters", "Filters")}{filtersOn ? ` (${filtersOn})` : ""}
        </button>
        <div id="sa-org-filters" className={`${s.moreFilters} ${more ? s.moreOpen : ""}`}>
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
        </div>
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
                { key: "name", label: t("sa.col.name", "Name"), render: (r) => <span><span className={s.strong}>{r.name}</span><br /><span className={`${s.small} ${s.muted}`}>{r.adminEmail}</span><br /><span className={`${s.small} ${s.muted}`}>{r.kind === "solo" ? t("sa.solo", "Solo") : t("sa.institute", "Institute")} · {r.country || "—"} · {t("sa.col.lastAdmin", "Admin seen")}: {r.lastAdminLogin || "—"}</span></span> },
                { key: "status", label: t("sa.col.status", "Status"), render: (r) => <span className={s.stackSm}><StatusPill status={r.suspendedAt ? "suspended" : r.status} /><span className={`${s.small} ${s.muted}`}>{r.plan} · {r.subscriptionStatus}</span>{r.flags.length > 0 && <FlagPills flags={r.flags} />}</span> },
                { key: "seats", label: t("sa.col.seats", "Seats"), align: "end", render: (r) => <span className={s.nowrap}>{r.seatsUsed}{r.seatLimit ? ` / ${r.seatLimit}` : ""}<br /><span className={`${s.small} ${s.muted}`}>{t("sa.orgs.activeN", "{{n}} active 7 d", { n: r.active7 })}</span></span> },
                { key: "health", label: t("sa.col.health", "Health"), render: (r) => <HealthBar value={r.health} /> },
              ]}
            />
            <Pager page={D.page} limit={D.limit} total={D.total} onPage={(p) => set({ page: String(p) })} />
          </>
        )}
      </Loadable>
      {naming != null && (
        <Modal title={t("sa.orgs.viewName", "Name this view")} onClose={() => setNaming(null)} footer={<>
          <Button variant="ghost" onClick={() => setNaming(null)}>{t("sa.cancel", "Cancel")}</Button>
          <Button onClick={() => saveView(naming.trim())} disabled={!naming.trim()}>{t("sa.orgs.saveView", "Save view")}</Button>
        </>}>
          <form onSubmit={(e) => { e.preventDefault(); saveView(naming.trim()); }}>
            <Field label={t("sa.orgs.viewLabel", "View name")} hint={t("sa.orgs.viewHint", "Saves the filters you have now, for your account.")}>
              <input className={s.input} value={naming} onChange={(e) => setNaming(e.target.value)} placeholder={t("sa.orgs.viewPh", "e.g. Schools at risk")} />
            </Field>
          </form>
        </Modal>
      )}
    </Panel>
  );
}
