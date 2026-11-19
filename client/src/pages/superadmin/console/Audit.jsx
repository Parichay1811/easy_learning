// Platform audit log (SUP-003): who did what, to whom, in which organisation
// and why. Search by person, organisation, learner or action; export (owners);
// check the hash chain for tampering. Also lists "view as" sessions.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, DataTable } from "../../../components/dashboard";
import { useConsoleApi, useLoad, qs, dateTime } from "./api";
import { Field, Loadable, Notice, Pager, Panel, Pill, TabBody, Tabs } from "./ui";
import s from "./console.module.css";

const FIELDS = ["actor", "org", "target", "action", "q", "from", "to"];

function Events({ role, params, setParams }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const f = Object.fromEntries(FIELDS.map((k) => [k, params.get(k) || ""]));
  const page = Number(params.get("page") || 1);
  const [form, setForm] = useState(f);
  const [check, setCheck] = useState(null);
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);
  const filtersOn = ["org", "target", "action", "from", "to"].filter((k) => f[k]).length;
  const list = useLoad(`/audit${qs({ ...f, page, limit: 50 })}`);
  const set = (patch) => setParams(() => new URLSearchParams(Object.fromEntries(Object.entries({ section: "audit", ...f, ...patch }).filter(([, v]) => v))));
  const L = list.data;
  const verify = async () => {
    setBusy(true);
    try { setCheck(await api.get("/audit/verify")); } catch (e) { setCheck({ error: e.message }); } finally { setBusy(false); }
  };
  return (
    <Panel title={t("sa.au.title", "Audit log")} sub={t("sa.au.sub", "Every staff action and every sensitive action in any organisation. Append-only and hash-chained.")} actions={<>
      <Button size="sm" variant="ghost" onClick={verify} disabled={busy}>{busy ? t("sa.working", "Working…") : t("sa.au.verify", "Check integrity")}</Button>
      {role === "owner" && <Button size="sm" variant="soft" onClick={() => api.download(`/audit/export${qs(f)}`, "learnigo-audit.csv")}>{t("sa.export", "Export CSV")}</Button>}
    </>}>
      {check && (check.error ? <Notice tone="alert" onClose={() => setCheck(null)}>{check.error}</Notice>
        : check.ok ? <Notice tone="good" onClose={() => setCheck(null)}>{t("sa.au.ok", "Intact: all {{n}} events link up and none was changed ({{ms}} ms).", { n: check.checked, ms: check.ms })}</Notice>
          : <Notice tone="alert" onClose={() => setCheck(null)}>{t("sa.au.broken", "Broken at event {{id}} ({{action}}, {{at}}): {{p}} {{n}} events before it are intact.", { id: check.firstBreak.id, action: check.firstBreak.action, at: dateTime(check.firstBreak.at), p: check.firstBreak.problem, n: check.checked })}</Notice>)}
      <form className={s.toolbar} role="search" onSubmit={(e) => { e.preventDefault(); set({ ...form, page: "" }); }}>
        <Field label={t("sa.au.actor", "Who (email)")}><input className={s.input} value={form.actor} onChange={(e) => setForm({ ...form, actor: e.target.value })} /></Field>
        <button type="button" className={`${s.chipBtn} ${s.filterToggle}`} aria-expanded={more} aria-controls="sa-audit-filters" onClick={() => setMore((v) => !v)}>
          {t("sa.filters", "Filters")}{filtersOn ? ` (${filtersOn})` : ""}
        </button>
        <div id="sa-audit-filters" className={`${s.moreFilters} ${more ? s.moreOpen : ""}`}>
        <Field label={t("sa.au.org", "Organisation id")}><input className={s.input} value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} /></Field>
        <Field label={t("sa.au.target", "About (learner email or id)")}><input className={s.input} value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} /></Field>
        <Field label={t("sa.au.action", "Action")}>
          <select className={s.select} value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}>
            <option value="">{t("sa.all", "All")}</option>
            {["staff", "support.view_as", "people", "learner", "org", "billing", "flag", "data_rights", "content", "settings", "audit"].map((a) => <option key={a} value={a}>{a}.*</option>)}
            {(L?.actions || []).map((a) => <option key={`x-${a}`} value={a}>{a}</option>)}
          </select>
        </Field>
        <Field label={t("sa.au.from", "From")}><input type="date" className={s.input} value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} /></Field>
        <Field label={t("sa.au.to", "To")}><input type="date" className={s.input} value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} /></Field>
        </div>
        <Button type="submit" size="sm">{t("sa.apply", "Search")}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => { setForm(Object.fromEntries(FIELDS.map((k) => [k, ""]))); setParams(new URLSearchParams({ section: "audit" })); }}>{t("sa.clear", "Clear")}</Button>
      </form>
      <Loadable state={list} empty={L && !L.events.length ? { title: t("sa.au.none", "Nothing matches.") } : null}>
        {L && (
          <>
            <DataTable caption={t("sa.au.title", "Audit log")} rows={L.events} getRowKey={(e) => e.id} columns={[
              { key: "at", label: t("sa.au.whenWho", "When and who"), render: (e) => <span><span className={s.strong}>{dateTime(e.at)}</span><br />{e.actorEmail || e.actorId || "—"}<br /><span className={`${s.small} ${s.muted}`}>{e.actorRole}</span></span> },
              { key: "action", label: t("sa.au.what", "What"), render: (e) => <span><span className={s.mono}>{e.action}</span><br /><span className={`${s.small} ${s.muted}`}>{e.targetType ? `${e.targetType} ` : ""}<span className={s.mono}>{e.targetId || ""}</span></span></span> },
              { key: "orgId", label: t("sa.au.orgCol", "Org"), render: (e) => (e.orgId ? <button type="button" className={s.linkBtn} onClick={() => set({ org: e.orgId, page: "" })}>{e.orgId.slice(-6)}</button> : "—") },
              { key: "reason", label: t("sa.au.why", "Why"), render: (e) => e.reason || (e.meta ? <span className={`${s.small} ${s.muted} ${s.mono} ${s.breakAny}`}>{JSON.stringify(e.meta).slice(0, 80)}</span> : "—") },
            ]} />
            <Pager page={L.page} limit={L.limit} total={L.total} onPage={(p) => set({ page: String(p) })} />
          </>
        )}
      </Loadable>
    </Panel>
  );
}

function ViewAsSessions() {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const list = useLoad("/view-as?limit=50");
  return (
    <Panel title={t("sa.au.viewAs", "View-as sessions")} sub={t("sa.au.viewAsSub", "Read-only, 30 minutes, always with a reason. The organisation's admin sees these too.")}>
      <Loadable state={list} empty={list.data && !list.data.sessions.length ? { title: t("sa.au.noViewAs", "No view-as sessions yet.") } : null}>
        {list.data && <DataTable caption={t("sa.au.viewAs", "View-as sessions")} rows={list.data.sessions} getRowKey={(x) => x.id} columns={[
          { key: "createdAt", label: t("sa.au.when", "When"), render: (x) => dateTime(x.createdAt) },
          { key: "staffEmail", label: t("sa.au.who", "Who") },
          { key: "target", label: t("sa.au.as", "As"), render: (x) => <span>{x.targetName || x.targetEmail} <Pill>{x.targetRole}</Pill></span> },
          { key: "reason", label: t("sa.au.why", "Why") },
          { key: "active", label: t("sa.col.status", "Status"), render: (x) => (x.active ? <span className={s.row}><Pill tone="attention">{t("sa.au.live", "active")}</Pill><Button size="sm" variant="ghost" onClick={async () => { await api.post(`/view-as/${x.id}/end`); list.reload(); }}>{t("sa.au.end", "End")}</Button></span> : <Pill>{t("sa.au.ended", "ended")}</Pill>) },
        ]} />}
      </Loadable>
    </Panel>
  );
}

export default function Audit(props) {
  const { t } = useTranslation();
  const tab = props.params.get("tab") || "events";
  return (
    <>
      <Tabs label={t("sa.au.title", "Audit log")} value={tab} onChange={(k) => props.setParams(new URLSearchParams({ section: "audit", tab: k }))} tabs={[{ key: "events", label: t("sa.au.events", "Events") }, { key: "viewas", label: t("sa.au.viewAs", "View-as sessions") }]} />
      <TabBody value={tab}>{tab === "events" ? <Events {...props} /> : <ViewAsSessions />}</TabBody>
    </>
  );
}
