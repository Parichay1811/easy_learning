// People search (SUP-012): anyone by name, email or id, across roles and orgs.
// Opening a profile is audited; actions ask for a reason.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, DataTable } from "../../../components/dashboard";
import { useConsoleApi, useLoad, dateTime, qs } from "./api";
import { Facts, Field, Loadable, Modal, Notice, Panel, Pill, ReasonDialog, StatusPill } from "./ui";
import ViewAsDialog from "./ViewAsDialog";
import s from "./console.module.css";

const ROLE_LABEL = { admin: "Org admin", teacher: "Teacher", student: "Learner (school)", org_parent: "Parent (school)", parent: "Parent account", learner: "Learner (own account)" };

function Person({ role, id, onClose, go }) {
  const { t } = useTranslation();
  const api = useConsoleApi();
  const p = useLoad(`/people/${role}/${id}`);
  const [dialog, setDialog] = useState(null);
  const [note, setNote] = useState("");
  const P = p.data;
  const act = (action, label) => setDialog({ kind: "action", action, label });
  return (
    <Modal wide title={P ? `${P.person.name || P.person.email} · ${t(`sa.role.${role}`, ROLE_LABEL[role])}` : t("sa.loading", "Loading…")} onClose={onClose}>
      <Loadable state={p}>
        {P && (
          <>
            <Notice tone="good" onClose={() => setNote("")}>{note}</Notice>
            <Facts items={[
              [t("sa.f.email", "Email"), P.person.email],
              [t("sa.f.org", "Organisation"), P.person.org ? <button key="o" type="button" className={s.linkBtn} onClick={() => { onClose(); go("orgs", { org: P.person.org.saOrgId }); }}>{P.person.org.name}</button> : "—"],
              [t("sa.f.status", "Status"), P.person.status || P.security.authStatus || "active"],
              [t("sa.f.lastLearning", "Last learning"), P.activity.lastLearning || "—"],
              [t("sa.f.lastSignIn", "Last signed in"), P.activity.lastSignIn || "—"],
              [t("sa.f.created", "Created"), dateTime(P.person.createdAt)],
              P.person.plan && [t("sa.col.plan", "Plan"), P.person.plan],
              P.security.signedOutBefore && [t("sa.f.signedOut", "Signed out everywhere"), dateTime(P.security.signedOutBefore)],
            ]} />
            {(P.links.guardians.length > 0 || P.links.children.length > 0 || P.links.schoolParents.length > 0 || P.links.groups.length > 0) && (
              <div className={s.grid2}>
                {P.links.guardians.length > 0 && <div><h3 className={s.label}>{t("sa.p.guardians", "Guardians")}</h3><ul className={s.list}>{P.links.guardians.map((g) => <li key={g._id} className={s.listItem}><span>{g.parent?.name || "—"} · {g.parent?.email}</span><StatusPill status={g.linkStatus === "verified" ? "active" : "pending"} label={g.linkStatus} /></li>)}</ul></div>}
                {P.links.children.length > 0 && <div><h3 className={s.label}>{t("sa.p.children", "Children")}</h3><ul className={s.list}>{P.links.children.map((c) => <li key={c._id} className={s.listItem}><span>{c.name} · {c.email}</span><StatusPill status={c.linkStatus === "verified" ? "active" : "pending"} label={c.linkStatus} /></li>)}</ul></div>}
                {P.links.schoolParents.length > 0 && <div><h3 className={s.label}>{t("sa.p.schoolParents", "Parents at school")}</h3><ul className={s.list}>{P.links.schoolParents.map((c) => <li key={c._id} className={s.listItem}>{c.name} · {c.email}</li>)}</ul></div>}
                {P.links.groups.length > 0 && <div><h3 className={s.label}>{t("sa.p.groups", "Groups")}</h3><ul className={s.list}>{P.links.groups.map((g) => <li key={g.id} className={s.listItem}>{g.name}</li>)}</ul></div>}
              </div>
            )}
            <div className={s.row}>
              {P.security.canViewAs && <Button size="sm" variant="soft" onClick={() => setDialog({ kind: "viewas" })}>{t("sa.viewAs", "View as")}</Button>}
              {["admin", "teacher", "parent", "student", "learner"].includes(role) && <Button size="sm" variant="ghost" onClick={() => act("revoke-sessions", t("sa.p.revoke", "Sign out everywhere"))}>{t("sa.p.revoke", "Sign out everywhere")}</Button>}
              {role === "teacher" && <Button size="sm" variant="ghost" onClick={() => act("reset-login", t("sa.p.reset", "Reset Google sign-in"))}>{t("sa.p.reset", "Reset Google sign-in")}</Button>}
              {["teacher", "org_parent"].includes(role) && <Button size="sm" variant="ghost" onClick={() => act("resend-invite", t("sa.p.invite", "Resend invite"))}>{t("sa.p.invite", "Resend invite")}</Button>}
            </div>
            <h3 className={s.label}>{t("sa.p.audit", "Recent audit about this person")}</h3>
            {P.audit.length ? <ul className={s.list}>{P.audit.map((e) => <li key={e.id} className={s.listItem}><span><span className={s.mono}>{e.action}</span> · {e.actorEmail || e.actorRole}{e.reason ? ` · ${e.reason}` : ""}</span><span className={`${s.small} ${s.muted}`}>{dateTime(e.at)}</span></li>)}</ul> : <p className={s.muted}>{t("sa.none", "None.")}</p>}
          </>
        )}
      </Loadable>
      {dialog?.kind === "viewas" && <ViewAsDialog target={{ role: role === "parent" ? "parent" : role, id, name: P.person.name, email: P.person.email }} onClose={() => setDialog(null)} />}
      {dialog?.kind === "action" && <ReasonDialog title={dialog.label} min={dialog.action === "resend-invite" ? 0 : 5} onClose={() => setDialog(null)} onConfirm={async (reason) => { const r = await api.post(`/people/${role}/${id}/${dialog.action}`, { reason }); setNote(r.message); p.reload(); }} />}
    </Modal>
  );
}

export default function People({ go, params, setParams }) {
  const { t } = useTranslation();
  const [q, setQ] = useState(params.get("q") || "");
  const [role, setRole] = useState(params.get("role") || "");
  const search = params.get("q") || "";
  const res = useLoad(search.length >= 2 ? `/people${qs({ q: search, role: params.get("role") })}` : null, { skip: search.length < 2 });
  const open = params.get("person");
  const [pRole, pId] = (open || "").split(":");
  const set = (patch) => setParams((p) => { const n = new URLSearchParams(p); for (const [k, v] of Object.entries(patch)) { if (v) n.set(k, v); else n.delete(k); } n.set("section", "people"); return n; });

  return (
    <Panel title={t("sa.people.title", "People")} sub={t("sa.people.sub", "Search every account: admins, teachers, learners and parents. Opening a profile is recorded in the audit log.")}>
      <form className={s.toolbar} role="search" onSubmit={(e) => { e.preventDefault(); set({ q, role }); }}>
        <Field label={t("sa.search", "Search")}><input className={`${s.input} ${s.search}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("sa.people.ph", "Name, email or id (at least 2 characters)")} /></Field>
        <Field label={t("sa.people.role", "Role")}>
          <select className={s.select} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">{t("sa.all", "All")}</option>
            {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{t(`sa.role.${k}`, v)}</option>)}
          </select>
        </Field>
        <Button type="submit" size="sm">{t("sa.apply", "Search")}</Button>
      </form>
      {search.length < 2 ? <p className={s.muted}>{t("sa.people.start", "Type a name or an email to start.")}</p> : (
        <Loadable state={res} empty={res.data && !res.data.rows.length ? { title: t("sa.people.none", "Nobody found."), text: t("sa.people.noneText", "Try part of the email address.") } : null}>
          {res.data && (
            <DataTable
              caption={t("sa.people.caption", "People found")}
              rows={res.data.rows}
              getRowKey={(r) => `${r.role}:${r.id}`}
              onRowClick={(r) => set({ person: `${r.role}:${r.id}` })}
              columns={[
                { key: "name", label: t("sa.col.name", "Name"), render: (r) => <span><span className={s.strong}>{r.name || "—"}</span><br /><span className={`${s.small} ${s.muted}`}>{r.email}</span></span> },
                { key: "role", label: t("sa.col.role", "Role"), render: (r) => <Pill tone="accent">{t(`sa.role.${r.role}`, ROLE_LABEL[r.role])}</Pill> },
                { key: "org", label: t("sa.f.org", "Organisation"), render: (r) => r.org?.name || "—" },
                { key: "status", label: t("sa.col.status", "Status"), render: (r) => <StatusPill status={r.status} /> },
                { key: "lastActive", label: t("sa.col.lastActive", "Last active"), render: (r) => r.lastActive || "—" },
              ]}
            />
          )}
        </Loadable>
      )}
      {open && <Person role={pRole} id={pId} go={go} onClose={() => set({ person: "" })} />}
    </Panel>
  );
}
